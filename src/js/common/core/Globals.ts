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
  maxSpeed: 1000,
	playing: true,
	lastElapsedTime: 0,
	backwards: false,
}

export const VISUAL_SETTINGS = {
	current: 'low',
	low: 10000,
	medium: 32000,
	high: 50000,
	ultra: 200000
}