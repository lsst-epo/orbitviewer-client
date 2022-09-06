/**
 * DEV_MODE is injected by esbuild
 */
export const DEV = DEV_MODE;
export const TARGET = TARGET_MODE;
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

export const CONTROLS = {
	min: 0.5,
	max: 150,
	orbit: null
}

export const CLOCK_SETTINGS = {
	speed: 0,
  maxSpeed: 500,
	playing: true,
	lastElapsedTime: 0,
	backwards: false,
}