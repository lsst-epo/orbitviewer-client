import { Size } from "@jocabola/gfx";
import { isMobile } from "@jocabola/utils";
require('dotenv').config();

/**
 * DEV_MODE is injected by esbuild
 */
export const DEV = DEV_MODE;
export const TARGET = TARGET_MODE;

export const HASURA_URL = process.env.HASURA_API_ENDPOINT;


export const PATHS = {
	uploads: '/uploads',
	assets: '/assets',
};

export const CONTROLS = {
	min: 5,
	max: 60000,
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
	current: isMobile() ? 'low' : 'medium',
	low: getParticleCount(GPU_SIM_SIZES.low),
	medium: getParticleCount(GPU_SIM_SIZES.medium),
	high: getParticleCount(GPU_SIM_SIZES.high),
	ultra: getParticleCount(GPU_SIM_SIZES.ultra)
}