const express = require('express');
const cors = require('cors');
const port = 8080;
const users = require('./utils/users');
const files = require('./utils/files');
const fileUpload = require('express-fileupload');
const ip = require("ip");
const path = require('path');

// -------------------------------------------------------------------- APP
const app = express();
const domain = 'ft.fil.works';

const appIp = `${ip.address()}:${port}`;
/* console.dir(`http://${appIp}:${port}/app`);
console.dir(`http://${appIp}:${port}/ipad`); */


// -------------------------------------------------------------------- LISTEN
const fil = `\u001b[1;35m[fil] `; // 31 Vermell - 32 Verd ... 36 Cyan
const welcome = () => {
	console.log(`${fil}Fil Tool -- Server up and running at ${ip.address}`);
};

// app.use(
// 	cors({
// 		origin: ['http://localhost:8081', 'http://localhost:8080', 'https://208.113.131.135', 'https://3.239.69.253', 'http://localhost', `https://${domain}`, `http://${appIp}:8888`],
// 	})
// );
app.use(fileUpload());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.listen(port, welcome);

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, '../public/en/index.html'));
});


// -------------------------------------------------------------------- USERS SERVER
app.post('/user', (req, res) => {
	const token = users.checkUser(req.body);
	if (token) res.json({ token });
	else res.json({ auth: false });
});

// -------------------------------------------------------------------- FILES SERVER
app.post('/file', (req, res) => {
	files.saveFile(req, res);
});
app.post('/json', (req, res) => {
	files.saveJson(req.body, res);
});
