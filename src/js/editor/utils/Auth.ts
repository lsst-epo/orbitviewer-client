import { DEV, SERVER_URL, TOKEN, USER } from '../../common/core/Globals';
import { createPopup, removePopup } from './Popup';
import md5 = require('md5');
import { COPIES } from '../core/GlobalsEditor';

let retryCount = 0;

export class Auth {
	token: string = null;
	user: string = null;
	authentication: boolean = false;

	popup: HTMLElement = null;
	popupActive: boolean = false;
	retry: boolean = false;
	constructor() {
		window.addEventListener('keydown', (ev) => {
			if (!this.popupActive) return;
			if (ev.code === 'Enter' || ev.code === 'NumpadEnter') this.popup.querySelector('button').click();
		});

		// USER.name = null;
		// TOKEN.value = null;
		// localStorage.clear();
	}

	init(callback) {
		this.popupActive = true;
		this.createPopup();

		const p = new Promise((resolve, reject): void => {
			const submit = this.popup.querySelector('button');

			submit.addEventListener(
				'click',
				(e) => {
					const userInput = this.popup.querySelector('#user') as HTMLInputElement;
					const passInput = this.popup.querySelector('#password') as HTMLInputElement;

					const user = USER.name ? USER.name : userInput.value;

					const values = {
						user: DEV ? 'DEV_USER' : user,
						password: DEV ? '3d3acab1b7d2a153851718d749fda2b0' : md5(passInput.value),
						token: TOKEN.value,
					};

					USER.name = values.user;

					this.sendRequest(
						values,
						(res) => {
							if (!res.token) reject();
							localStorage.setItem('fil-user', USER.name);
							localStorage.setItem('fil-token', res.token);
							TOKEN.value = res.token;
							this.retry = false;
							this.popupActive = false;

							resolve('success');
						},
						(err) => {
							console.error(err);
							reject(err);
						}
					);

					removePopup();
				},
				{ once: true }
			);

			if (DEV || (TOKEN.value != 'false' && TOKEN.value != null)) {
				submit.click();
			}
		});

		p.then(() => {
			callback();
			console.warn('RIGHT USER - PASS');

			setInterval(() => {
				const values = {
					token: TOKEN.value,
				};

				this.sendRequest(
					values,
					(res) => {

					},
					(err) => {
						console.error(err);
						window.location.reload();
					}
				);
			}, 120000);
		}).catch(() => {
			console.error('WRONG USER - PASS');

			setTimeout(() => {
				this.retry = true;
				this.init(callback);
				retryCount++;
				if (retryCount > 9) window.location.reload();
			}, 5000);
		});
	}

	async sendRequest(data, callback: Function = (res) => {}, error: Function = (err) => {}) {
		await fetch(`${SERVER_URL}/user`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		})
			.then((res) => {
				if (res.ok) return res.json();
				else {
					localStorage.clear();
					window.location.reload();
					return { auth: false };
				}
			})
			.then((resJSON) => callback(resJSON))
			.catch((err) => {
				error(err);
			});
	}

	createPopup() {
		this.popup = createPopup(false);
		if (this.retry) {
			this.popup.classList.add('auth__denied');
			setTimeout(() => {
				this.popup?.classList.remove('auth__denied');
			}, 2000);
		}

		this.popup.classList.add('auth__popup');

		this.popup.innerHTML = `
			<div>
				<label for="user">${COPIES.auth.user}</label>
				<input id="user" type="text" value="">
			</div>
			<div>
				<label for="password">${COPIES.auth.password}</label>
				<input id="password" type="password" value="">
			</div>
			<button id="auth_submit">${COPIES.auth.submit}</button>
		`;

		document.getElementById('user').focus();
	}
}
