import { Size } from "@jocabola/gfx";

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
	min: 0.25,
	max: 300,
	orbit: null
}

export const CLOCK_SETTINGS = {
	speed: 0,
  maxSpeed: 1000,
	playing: true,
	lastElapsedTime: 0,
	backwards: false,
}

export const GPU_SIM_SIZES = {
	low: {
		width: 128,
		height: 128
	},
	medium: {
		width: 256,
		height: 128
	},
	high: {
		width: 256,
		height: 256
	},
	ultra: {
		width: 512,
		height: 512
	}
}

export function getParticleCount(s:Size) {
	return s.width * s.height;
}

export const VISUAL_SETTINGS = {
	current: 'low',
	low: getParticleCount(GPU_SIM_SIZES.low),
	medium: getParticleCount(GPU_SIM_SIZES.medium),
	high: getParticleCount(GPU_SIM_SIZES.high),
	ultra: getParticleCount(GPU_SIM_SIZES.ultra)
}