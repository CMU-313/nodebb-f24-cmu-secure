'use strict';

const _ = require('lodash');
const db = require('../database');
const topics = require('./topics');
const privileges = require('../privileges');
const utils = require('../utils');
const plugins = require('../plugins');
// const event = require('../event');

const Pin = {};

// const event = require('../event');

// Toggle Pin/Unpin a topic
Pin.togglePin = async function (tid, uid, pin) {
	// Fetch topic data
	const topicData = await fetchTopicData(tid);
	// Validate if the pin/unpin action is allowed
	await validatePinAction(topicData, uid, pin);

	// Update the pin status in the database
	await Promise.all(updatePinStatusInDatabase(tid, topicData, pin));

	// Emit events for pin/unpin action
	emitPinEvent(tid, uid, pin, topicData);
	return { tid, pinned: pin };
};

// Fetch topic data from the database
async function fetchTopicData(tid) {
	const topicData = await topics.getTopicData(tid);
	if (!topicData) {
		throw new Error('[[error:no-topic]]');
	}
	return topicData;
}

// Validate if the pin/unpin action is allowed
async function validatePinAction(topicData, uid, pin) {
	if (topicData.scheduled) {
		throw new Error('[[error:cant-pin-scheduled]]');
	}
	if (uid !== 'system' && !await privileges.topics.isAdminOrMod(topicData.tid, uid)) {
		throw new Error('[[error:no-privileges]]');
	}
	if (pin && topicData.pinned) {
		throw new Error('[[error:topic-already-pinned]]');
	} else if (!pin && !topicData.pinned) {
		throw new Error('[[error:topic-not-pinned]]');
	}
}

// Update the pin status in the database
function updatePinStatusInDatabase(tid, topicData, pin, uid) {
	const promises = [
		topics.setTopicField(tid, 'pinned', pin ? 1 : 0),
		topics.events.log(tid, { type: pin ? 'pin' : 'unpin', uid }),
	];

	if (pin) {
		promises.push(db.sortedSetAdd(`cid:${topicData.cid}:tids:pinned`, Date.now(), tid));
		promises.push(db.sortedSetsRemove([
			`cid:${topicData.cid}:tids`,
			`cid:${topicData.cid}:tids:create`,
			`cid:${topicData.cid}:tids:posts`,
			`cid:${topicData.cid}:tids:votes`,
			`cid:${topicData.cid}:tids:views`,
		], tid));
	} else {
		promises.push(db.sortedSetRemove(`cid:${topicData.cid}:tids:pinned`, tid));
		promises.push(topics.deleteTopicField(tid, 'pinExpiry'));
		promises.push(db.sortedSetAddBulk([
			[`cid:${topicData.cid}:tids`, topicData.lastposttime, tid],
			[`cid:${topicData.cid}:tids:create`, topicData.timestamp, tid],
			[`cid:${topicData.cid}:tids:posts`, topicData.postcount, tid],
			[`cid:${topicData.cid}:tids:votes`, parseInt(topicData.votes, 10) || 0, tid],
			[`cid:${topicData.cid}:tids:views`, topicData.viewcount, tid],
		]));
		topicData.pinExpiry = undefined;
		topicData.pinExpiryISO = undefined;
	}

	return promises;
}

// Emit events for pin/unpin action
function emitPinEvent(tid, uid, pin, topicData) {
	plugins.hooks.fire('action:topic.pin', { topic: _.clone(topicData), uid });
	return (pin ? 'topic.pinned' : 'topic.unpinned', { tid, uid });
}

// Pin a topic
Pin.pinTopic = async function (tid, uid) {
	return await Pin.togglePin(tid, uid, true);
};

// Unpin a topic
Pin.unpinTopic = async function (tid, uid) {
	return await Pin.togglePin(tid, uid, false);
};

// Set pin expiry for a topic
Pin.setPinExpiryForTopic = async function (tid, expiry, uid) {
	// Validate the expiry date
	validateExpiryDate(expiry);
	// Check if the user has the necessary privileges
	await checkUserPrivileges(tid, uid);

	// Fetch the topic data
	const topic = await topics.getTopicData(tid);

	// Set the pin expiry in the database
	await topics.setTopicField(tid, 'pinExpiry', expiry);
	plugins.hooks.fire('action:topic.setPinExpiry', { topic, uid, expiry });
	return { tid, expiry };
};

// Validate the expiry date
function validateExpiryDate(expiry) {
	if (isNaN(parseInt(expiry, 10)) || expiry <= Date.now()) {
		throw new Error('[[error:invalid-data]]');
	}
}

// Check if the user has the necessary privileges
async function checkUserPrivileges(tid, uid) {
	const topic = await topics.getTopicFields(tid, ['cid', 'uid']);
	const isAdminOrMod = await privileges.categories.isAdminOrMod(topic.cid, uid);
	if (!isAdminOrMod) {
		throw new Error('[[error:no-privileges]]');
	}
}

// Check and expire pins if necessary
Pin.checkAndExpirePins = async function (tids) {
	const expiryDates = await topics.getTopicsFields(tids, ['pinExpiry']);
	const now = Date.now();

	const unpinPromises = expiryDates.map(async (topicExpiry, idx) => {
		if (topicExpiry && parseInt(topicExpiry.pinExpiry, 10) <= now) {
			await Pin.unpinTopic(tids[idx], 'system');
			return null;
		}
		return tids[idx];
	});

	const filteredTids = (await Promise.all(unpinPromises)).filter(Boolean);
	return filteredTids;
};

// Order pinned topics
Pin.orderPinnedTopics = async function (uid, data) {
	const { tid, order } = data;
	const cid = await topics.getTopicField(tid, 'cid');
	validateOrderData(cid, tid, order);

	const isAdminOrMod = await privileges.categories.isAdminOrMod(cid, uid);
	if (!isAdminOrMod) {
		throw new Error('[[error:no-privileges]]');
	}

	const pinnedTids = await db.getSortedSetRange(`cid:${cid}:tids:pinned`, 0, -1);
	const currentIndex = pinnedTids.indexOf(String(tid));
	if (currentIndex === -1) {
		return;
	}

	const newOrder = pinnedTids.length - order - 1;
	if (pinnedTids.length > 1) {
		pinnedTids.splice(Math.max(0, newOrder), 0, pinnedTids.splice(currentIndex, 1)[0]);
	}

	await db.sortedSetAddBulk(
		`cid:${cid}:tids:pinned`,
		pinnedTids.map((tid, index) => index),
		pinnedTids
	);

	return pinnedTids;
};

// Validate the order data
function validateOrderData(cid, tid, order) {
	if (!cid || !tid || !utils.isNumber(order) || order < 0) {
		throw new Error('[[error:invalid-data]]');
	}
}

module.exports = Pin;
