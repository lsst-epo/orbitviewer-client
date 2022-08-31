import { SERVER_URL, TOKEN } from "../../common/core/Globals";

export const SaveImage = (id: string, path: string = '', image: HTMLImageElement, callback = (success) => {}) => {
	const form = new FormData();

	form.append('token', TOKEN.value);
	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;

	const ctx = canvas.getContext('2d');

	ctx.drawImage(image, 0, 0);

	canvas.toBlob((blob) => {
		form.append('path', `${path}/`);
		form.append('format', `webp`);
		form.append('file', blob, id);

		return SendPromise(form, callback);
	}, 'image/webp');
};

export const SaveFile = (name: string, path: string, format: string, file, callback = (success) => {}) => {
	const form = new FormData();

	form.append('token', TOKEN.value);

	const type = format ? format : file.type;
	const blob = new Blob([file], {
		type,
	});
	form.append('path', `${path}/`);
	form.append('format', type);
	form.append('file', blob, name);

	return SendPromise(form, (success) => {
		if (success) console.warn('UPLOAD CORRECT');
		else console.error('UPLOAD NOT CORRECT');
		callback(success);
	});
};

export const SaveJSON = (path, json, callback = (success) => {}) => {
	console.log('Saving ', path);
	
	const data = {
		token: TOKEN.value,
		name: path,
		json: json,
	};

	return SendPromise(data, callback, 'json');
};

const SendPromise = (data, callback = (success) => {}, type = 'file') => {
	const promise = new Promise((resolve, reject) => {
		const sendCallback = (response) => {
			if (response.status != 202) reject(false);
			resolve(true);
		};

		if (type === 'file') SendFiles(data).then(sendCallback);
		if (type === 'json') SendJson(data).then(sendCallback);
	});

	return promise
		.then(() => {
			callback(true);
		})
		.catch(() => {
			callback(false);
		});
};

async function SendFiles(form) {
	const response = await fetch(`${SERVER_URL}/file`, {
		method: 'POST',
		body: form,
	});

	return await response;
}

async function SendJson(data) {
	const response = await fetch(`${SERVER_URL}/json`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	});

	return await response;
}
