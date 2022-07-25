const { EditorApp } = require('./core/EditorApp');

import { Auth } from "./utils/Auth";
export const AUTH = new Auth();

AUTH.init(() => {
	const _EditorApp = new EditorApp();
});