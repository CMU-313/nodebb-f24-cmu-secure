'use strict';

const ratelimit = module.exports;
const timeframe = 600000;

ratelimit.isFlooding = function (socket) {
	socket.callsPerSecond = socket.callsPerSecond || 0;
	socket.elapsedTime = socket.elapsedTime || 0;
	socket.lastCallTime = socket.lastCallTime || Date.now();
	socket.callsPerSecond += 1;
	const now = Date.now();
	socket.elapsedTime += now - socket.lastCallTime;
	if (socket.elapsedTime >= timeframe) {
		socket.elapsedTime = 0;
		socket.callsPerSecond = 0;
	}
	socket.lastCallTime = now;
	return false;
};


