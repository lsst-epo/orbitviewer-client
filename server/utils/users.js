const md5 = require('md5');
const fil = `\u001b[1;32m[fil] `; // 31 Vermell - 32 Verd ... 36 Cyan

// Registered users
const existingUsers = [
	{
		user: 'DEV_USER',
		password: '3d3acab1b7d2a153851718d749fda2b0',
	},
	{
		user: 'edu',
		password: '3d3acab1b7d2a153851718d749fda2b0',
	},
	{
		user: 'marti',
		password: '3d3acab1b7d2a153851718d749fda2b0',
	}
];

// Active Sessions
const activeSessions = [];

const checkUser = (user) => {
	// console.log('user', user);
	if (user.token) {
		const authorized = checkSession(user.token);
		if (authorized) return user.token;
	}

	const userExists = existingUsers.find((item) => item.user === user.user && item.password === user.password);
	// console.log('EXISTS', userExists);
	if (!userExists) {
		return false;
	}
	const token = md5(Date.now() + Math.random() * 100);
	createSession(token);
	return token;
};

const checkSession = (token) => {
	const session = getSession(token);
	if (!session) {
		console.log(fil + 'Session NOT Authorized');
		return false;
	}
	console.log(fil + 'Session Authorized');
	refreshSession(token);
	return true;
};

const createSession = (token) => {
	const session = {
		token,
		timer: null,
	};

	activeSessions.push(session);
	refreshSession(token);
};

const getSession = (token) => {
	const session = activeSessions.find((s) => s.token === token);
	return session;
};

const timer = 3600000 * 24; // 1h * 24
const refreshSession = (token) => {
	const session = getSession(token);
	if (!session) return;

	if (session.timer) clearTimeout(session.timer);
	session.timer = null;
	session.timer = setTimeout(() => {
		closeSession(token);
	}, timer);
};

const closeSession = (token) => {
	const session = getSession(token);
	if (!session) return;

	if (session.timer) clearTimeout(session.timer);
	session.timer = null;
	activeSessions.splice(session);
};

module.exports.checkUser = checkUser;
module.exports.checkSession = checkSession;
