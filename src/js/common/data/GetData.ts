import { showLoader } from "../../production/ui/loader";
import { VISUAL_SETTINGS } from "../core/Globals";

const solarSystemElementsLimit = VISUAL_SETTINGS[VISUAL_SETTINGS.current];
const solarSystemElementsURL = `https://hasura-e3g4rcii3q-uc.a.run.app/api/rest`;

export async function getSolarSystemElements(limit:number = solarSystemElementsLimit) {
	showLoader();
	
	const url = `${solarSystemElementsURL}/orbit-elements/${limit}`;	

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': '_qfq_tMbyR4brJ@KHCzuJRU7'
		}
	})
	return await response.json();
}

export type Filters = {
	asteroids:boolean,
	centaurs:boolean,
	comets:boolean,
	interestellarObjects:boolean,
	nearEarthObjects:boolean,
	transNeptunianObjects:boolean,

	planets: boolean
}

const currentFilters:Filters = {
	asteroids: true,
	centaurs: true,
	comets: true,
	interestellarObjects: true,
	nearEarthObjects: true,
	transNeptunianObjects: true,

	planets: true
}

export const saveSelectedFilters = (domFilters:NodeListOf<HTMLInputElement>):Boolean => {
	
	// Todo posar aixo en funció logica repetida
	let needsUpdate = false;

	for(const filter of domFilters){
		
		switch (filter.name) {
			case 'asteroids':
				needsUpdate = currentFilters.asteroids != filter.checked ? true : needsUpdate;
				currentFilters.asteroids = filter.checked;				
				break;
			case 'centaurs':
				needsUpdate = currentFilters.centaurs != filter.checked ? true : needsUpdate;
				currentFilters.centaurs = filter.checked;
				break;
			case 'comets':
				needsUpdate = currentFilters.comets != filter.checked ? true : needsUpdate;
				currentFilters.comets = filter.checked;
				break;
			case 'interstellar-objects':
				needsUpdate = currentFilters.interestellarObjects != filter.checked ? true : needsUpdate;
				currentFilters.interestellarObjects = filter.checked;
				break;
			case 'near-earth-objects':
				needsUpdate = currentFilters.nearEarthObjects != filter.checked ? true : needsUpdate;
				currentFilters.nearEarthObjects = filter.checked;
				break;
			case 'trans-neptunian-objects':
				needsUpdate = currentFilters.transNeptunianObjects != filter.checked ? true : needsUpdate;
				currentFilters.transNeptunianObjects = filter.checked;
				break;
			case 'planets-moons':
				needsUpdate = currentFilters.planets != filter.checked ? true : needsUpdate;
				currentFilters.planets = filter.checked;
				break;

			default:
				break;
		}
	}	
	console.log(needsUpdate);
	
	return needsUpdate;
}

export async function getSolarSystemElementsByFilter() {
	
	showLoader();

	const url = `${solarSystemElementsURL}/orbit-elements-by-filter/${solarSystemElementsLimit}/${currentFilters.asteroids}/${currentFilters.centaurs}/${currentFilters.comets}/${currentFilters.interestellarObjects}/${currentFilters.nearEarthObjects}/${currentFilters.transNeptunianObjects}`;	

	// Todo si planets false amagar els planetes
	// si planets true ensenyar els planetes

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': '_qfq_tMbyR4brJ@KHCzuJRU7'
		}
	})
	return await response.json();
}

export const syncFilters = (domFilters:NodeListOf<HTMLInputElement>) => {

	for(const element of domFilters){
		const name = element.name;
			switch (name) {
			case 'asteroids':
				element.checked = currentFilters.asteroids;				
				break;
			case 'centaurs':
				element.checked = currentFilters.centaurs;
				break;
			case 'comets':
				element.checked = currentFilters.comets;
				break;
			case 'interstellar-objects':
				element.checked = currentFilters.interestellarObjects;
				break;
			case 'near-earth-objects':
				element.checked = currentFilters.nearEarthObjects;
				break;
			case 'trans-neptunian-objects':
				element.checked = currentFilters.transNeptunianObjects;
				break;
			case 'planets-moons':
				element.checked = currentFilters.planets;
				break;

			default:
				break;
		}
	}
	
}
