const fs = require('fs');

try {
	fs.rmSync('public', { recursive: true });
	fs.rmSync('src/data/_cache', { recursive: true });
} catch (e) {}

try {
	fs.rmSync('bundle', { recursive: true });
} catch (e) {}