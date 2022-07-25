const fs = require('fs');
const users = require('./users');

const sourcePath = `${__dirname}/../../uploads/`;
const publicPath = `${__dirname}/../../public/uploads/`;
const backupPath = `${__dirname}/../../backups/`;
if (!fs.existsSync(sourcePath)) fs.mkdirSync(sourcePath, { recursive: true });
if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true });
if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });

const saveJson = (data, res) => {
	if (!users.checkSession(data.token)) {
		res.sendStatus(401);
		return;
	}
	fs.writeFile(`${sourcePath}/data/${data.name}.json`, data.json, 'utf8', (err) => {});
	fs.writeFile(`${publicPath}/data/${data.name}.json`, data.json, 'utf8', (err) => {});

	res.json({ saved: true });
};

const saveFile = (req, res) => {
	const token = req.body.token;
	const authorized = users.checkSession(token);
	if (!authorized) {
		res.sendStatus(202);
		return;
	}

	const path = req.body.path;
	const file = req.files.file;

	const p1 = sourcePath + path;
	const p2 = publicPath + path;
	if (!fs.existsSync(p1)) fs.mkdirSync(p1, { recursive: true });
	if (!fs.existsSync(p2)) fs.mkdirSync(p2, { recursive: true });

	const paths = [sourcePath + path + file.name, publicPath + path + file.name];

	// Save backup if its scene
	if (req.body.path.includes('scene') && fs.existsSync(`${paths[0]}.glb`)) {
		const p = backupPath + Date.now() + '_scene.glb';
		fs.copyFileSync(`${paths[0]}.glb`, p);
	}

	fs.writeFile(`${paths[0]}.${req.body.format}`, file.data, (err) => {
		if (!err)
			fs.writeFile(`${paths[1]}.${req.body.format}`, file.data, (err) => {
				if (err) res.sendStatus(401);
				else res.sendStatus(202);
			});
		else res.sendStatus(401);
	});
};
module.exports.saveJson = saveJson;
module.exports.saveFile = saveFile;
