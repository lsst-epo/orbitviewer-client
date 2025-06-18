import { MathUtils } from "@jocabola/math";
import { hideLoader, showLoader } from "../../production/ui/loader";
import { broadcastPanelsClose } from "../../production/ui/panels/PanelsManager";
import { popups } from "../../production/ui/popups/PopupsManager";
import { CoreAppSingleton } from "../core/CoreApp";
import { HASURA_URL, VISUAL_SETTINGS } from "../core/Globals";
import { buildSimWithData } from "../solar/SolarParticlesManager";
import { MJD2JD, SolarTimeManager } from "../solar/SolarTime";

// Filters
export type Filters = {
	asteroids:boolean,
	centaurs:boolean,
	comets:boolean,
	interestellarObjects:boolean,
	nearEarthObjects:boolean,
	transNeptunianObjects:boolean,

	planets: boolean,
}

const CategoryToFilter:Record<string, string> = {
	'asteroids': 'asteroids',
	'centaurs': 'centaurs',
	'comets': 'comets',
	'interstellar-objects': 'interestellarObjects',
	'near-earth-objects': 'nearEarthObjects',
	'planets-moons': 'planets',
	'trans-neptunian-objects': 'transNeptunianObjects'
}

const TIME_f = 1850;
const TIME_MAX = new Date().getFullYear();

const time = {
	f: TIME_f,
	max: TIME_MAX
};


export const filters:Filters = {
	asteroids: true,
	centaurs: true,
	comets: true,
	interestellarObjects: true,
	nearEarthObjects: true,
	transNeptunianObjects: true,

	planets: true,
}

export const distance = {
	min: 0,
	max: 999999,
	value: {
		min: 0,
		max: 1
	},
	search: {
		min: 0,
		max: 999999
	}
}

export const discover = {
	min: SolarTimeManager.getMJDonDate(new Date(1850)),
	max: SolarTimeManager.getMJDonDate(new Date()),
	value: {
		min: 0,
		max: 1
	},
	search: {
		min: SolarTimeManager.getMJDonDate(new Date(1850)),
		max: SolarTimeManager.getMJDonDate(new Date())
	}
}

// Filters listeners
export interface FiltersListener {
	applyFilters(): void;
	resetFilters():void;
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
				needsUpdate = needsUpdate;
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
	const sameDistance = calculateDistance();
	const sameDiscover = calculateDiscover();	

	if(!needsUpdate && sameDistance && sameDiscover) {
		applyFilterSolarElements();
		broadcastPanelsClose();
		return
	}

	broadcastFilterChange();

	getSolarSystemElementsByFilter().then( (res) => {		
		const d = res.mpcorb;                                  
		buildSimWithData(d, false);

		hideLoader();
	}).catch(() => {
		console.error('Database fetch error')
	});

}

export const resetFilters = () => {

	for(const key in filters){
		filters[key] = true;
	}

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

const calculateDistance = () => {

	const newMin = MathUtils.map(distance.value.min, 0, 1, distance.min, distance.max);
	const newMax = MathUtils.map(distance.value.max, 0, 1, distance.min, distance.max);
	
	const same = newMin === distance.search.min && newMax === distance.search.max;

	distance.search.min = newMin;
	distance.search.max = newMax;

	return same;
}

const calculateDiscover = () => {	

	const newMin = MathUtils.map(discover.value.min, 0, 1, discover.min, discover.max);
	const newMax = MathUtils.map(discover.value.max, 0, 1, discover.min, discover.max);

	const same = newMin === discover.search.min && newMax === discover.search.max;

	discover.search.min = newMin;
	discover.search.max = newMax;	

	return same;
}


// Filters fetch
export async function getSolarSystemElements() {
	showLoader();

	const url = `${HASURA_URL}/orbit-elements/${VISUAL_SETTINGS[VISUAL_SETTINGS.current]}`;	

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': process.env.HASURA_SECRET_KEY
		}
	})
	return await response.json();
}

export async function getSolarSystemElementsByFilter() {

	showLoader();
	broadcastPanelsClose();
		
	const url = `${HASURA_URL}/orbit-elements-by-filter/${VISUAL_SETTINGS[VISUAL_SETTINGS.current]}/${distance.search.min}/${distance.search.max}/${discover.search.min}/${discover.search.max}/${filters.asteroids}/${filters.centaurs}/${filters.comets}/${filters.interestellarObjects}/${filters.nearEarthObjects}/${filters.transNeptunianObjects}`;	

	applyFilterSolarElements();

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': process.env.HASURA_SECRET_KEY
		}
	});
	
	return await response.json();
}

const applyFilterSolarElements = () => {
	// Hide all solarElements with given category
	const items = CoreAppSingleton.instance.solarElements;
	for(let i = 0, len = items.length; i < len; i++){
		const item = items[i];		
		item.visible = filters[CategoryToFilter[item.category]];
	}

	// Show hide labels & popups by category	
	for(const popup of popups){
		if(!filters[CategoryToFilter[popup.category]]) popup.label.dom.classList.add('filters-hidden')
		else popup.label.dom.classList.remove('filters-hidden')
	}

}