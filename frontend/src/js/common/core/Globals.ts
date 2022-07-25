/**
 * DEV_MODE is injected by esbuild
 */
export const DEV = DEV_MODE;
export const TARGET = TARGET_MODE;
export const COPIES = copies; // injected by 11ty
export const TOOL_VERSION = VERSION;

export const PATHS = {
	uploads: '/uploads',
	assets: '/assets',
};

export const SERVER_PORT = 3500;
export const SERVER_URL = DEV ? `http://localhost:${SERVER_PORT}` : 'https://ft.fil.works';


export const USER = {
	name: localStorage.getItem('fil-user'),
};

export const TOKEN = {
	value: localStorage.getItem('fil-token'),
};