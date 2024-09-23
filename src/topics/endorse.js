// Author @YG
// File Description:
// This files defines three methods that handles "endorse" action in the topic
//   menu bar. Two methods are used for handling direct toggling the "endorse"
//   button, and the last one is useful for filtering and retrieving post or
//   user data.
// The implementation logic mainly borrows from bookmarks.js in the same dir.

'use strict';

const db = require('../database');
const plugins = require('../plugins');

module.exports = function (Topics) {
	Topics.endorse = async function (pid, uid) {

	};

	Topics.unendorse = async function (pid, uid) {

	};


}