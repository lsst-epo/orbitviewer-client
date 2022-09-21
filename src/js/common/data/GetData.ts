
// const PLANETS = "planet_elems.json";

import { VISUAL_SETTINGS } from "../core/Globals";

// const DWARF_PLANETS = "dwarf_planet_elems.json";
const FILES = ["iso_elems.json", "parabolic_elems_simulated.json", "solarsystem_full_elems_100k.json"];

const solarSystemElementsLimit = VISUAL_SETTINGS[VISUAL_SETTINGS.current];
const solarSystemElementsURL = `https://hasura-e3g4rcii3q-uc.a.run.app/api/rest`;

export async function getSolarSystemElements(limit:number = solarSystemElementsLimit) {
	
	const url = `${solarSystemElementsURL}/orbit-elements/${limit}`;	

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': '_qfq_tMbyR4brJ@KHCzuJRU7'
		}
	})
	return await response.json();
}

const getPlanets = async () => {
	
	const data = [];

	return data;
}

const getDwarfPlanets = async () => {
	
	const data = [];

	return data;
}

