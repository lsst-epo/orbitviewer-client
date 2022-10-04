import { hideLoader, showLoader } from "../../production/ui/loader";
import { VISUAL_SETTINGS } from "../core/Globals";
import { buildSimWithData } from "../solar/SolarParticlesManager";

const HASURA_URL = `https://hasura-e3g4rcii3q-uc.a.run.app/api/rest`;


// Filters
export type Filters = {
	asteroids:boolean,
	centaurs:boolean,
	comets:boolean,
	interestellarObjects:boolean,
	nearEarthObjects:boolean,
	transNeptunianObjects:boolean,

	planets: boolean
}

const filters:Filters = {
	asteroids: true,
	centaurs: true,
	comets: true,
	interestellarObjects: true,
	nearEarthObjects: true,
	transNeptunianObjects: true,

	planets: true
}

// Filters listeners
export interface FiltersListener {
	applyFilters(): void;
	syncFilters():void;
}

const filtersListeners: Array<FiltersListener> = [];

export const addFiltersListener = (listener:FiltersListener) => {
	if(filtersListeners.includes(listener)) return;
	filtersListeners.push(listener);
}

export const broadcastFilterChange = () => {
	for(const listener of filtersListeners) listener.syncFilters();
}

export const saveSelectedFilters = (domFilters:NodeListOf<HTMLInputElement>):Boolean => {
	
	// Todo posar aixo en funció logica repetida
	let needsUpdate = false;

	for(const filter of domFilters){
		
		switch (filter.name) {
			case 'asteroids':
				needsUpdate = filters.asteroids != filter.checked ? true : needsUpdate;
				filters.asteroids = filter.checked;				
				break;
			case 'centaurs':
				needsUpdate = filters.centaurs != filter.checked ? true : needsUpdate;
				filters.centaurs = filter.checked;
				break;
			case 'comets':
				needsUpdate = filters.comets != filter.checked ? true : needsUpdate;
				filters.comets = filter.checked;
				break;
			case 'interstellar-objects':
				needsUpdate = filters.interestellarObjects != filter.checked ? true : needsUpdate;
				filters.interestellarObjects = filter.checked;
				break;
			case 'near-earth-objects':
				needsUpdate = filters.nearEarthObjects != filter.checked ? true : needsUpdate;
				filters.nearEarthObjects = filter.checked;
				break;
			case 'trans-neptunian-objects':
				needsUpdate = filters.transNeptunianObjects != filter.checked ? true : needsUpdate;
				filters.transNeptunianObjects = filter.checked;
				break;
			case 'planets-moons':
				needsUpdate = filters.planets != filter.checked ? true : needsUpdate;
				filters.planets = filter.checked;
				break;

			default:
				break;
		}
	}	
	
	return needsUpdate;
}

export const applyFilters = (domFilters: NodeListOf<HTMLInputElement>) => {
	
	const needsUpdate = saveSelectedFilters(domFilters);	

	if(!needsUpdate) return;

	broadcastFilterChange();

	showLoader();

	getSolarSystemElementsByFilter().then( (res) => {		
		const d = res.mpcorb;                                  
		buildSimWithData(d, false);

		hideLoader();
	}).catch(() => {
		console.error('Database fetch error')
	});

}

export const syncFilters = (domFilters: NodeListOf<HTMLInputElement>) => {	

	for(const element of domFilters){
		syncFilter(element);
	}
}

const syncFilter = (element:HTMLInputElement) => {
	let active = false;
	const name = element.name;
	
	switch (name) {
		case 'asteroids':				
			active = filters.asteroids;				
			break;
		case 'centaurs':
			active = filters.centaurs;
			break;
		case 'comets':
			active = filters.comets;
			break;
		case 'interstellar-objects':
			active = filters.interestellarObjects;
			break;
		case 'near-earth-objects':
			active = filters.nearEarthObjects;
			break;
		case 'trans-neptunian-objects':
			active = filters.transNeptunianObjects;
			break;
		case 'planets-moons':
			active = filters.planets;
			break;

		default:
			break;
	}

	if(element.checked != active){
		element.click();
	}
}



// Filters fetch
export async function getSolarSystemElements() {
	showLoader();

	const url = `${HASURA_URL}/orbit-elements/${VISUAL_SETTINGS[VISUAL_SETTINGS.current]}`;	

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': '_qfq_tMbyR4brJ@KHCzuJRU7'
		}
	})
	return await response.json();
}

export async function getSolarSystemElementsByFilter() {
	
	showLoader();

	let allFiltersActive = true;
	for(const filter in filters){
		if(!filter) allFiltersActive = false;
	}
	if(!allFiltersActive){		
		return await getSolarSystemElements();
	}
	
	const url = `${HASURA_URL}/orbit-elements-by-filter/${VISUAL_SETTINGS[VISUAL_SETTINGS.current]}/${filters.asteroids}/${filters.centaurs}/${filters.comets}/${filters.interestellarObjects}/${filters.nearEarthObjects}/${filters.transNeptunianObjects}`;	

	// Todo si planets false amagar els planetes
	// si planets true ensenyar els planetes

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': '_qfq_tMbyR4brJ@KHCzuJRU7'
		}
	})
	return await response.json();
}