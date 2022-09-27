import { filter } from "../../../data/locales";
import { VISUAL_SETTINGS } from "../core/Globals";

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

export type Filters = {
	asteroids:boolean,
	centaurs:boolean,
	comets:boolean,
	interestellarObjects:boolean,
	nearEarthObjects:boolean,
	transNeptunianObjects:boolean,

	planets: boolean
}

export const getSelectedFilters = (domFilters:NodeListOf<HTMLInputElement>):Filters => {
	
	const filters:Filters = {
		asteroids: true,
		centaurs: true,
		comets: true,
		interestellarObjects: true,
		nearEarthObjects: true,
		transNeptunianObjects: true,
		planets: true
	}

	// Recent discoveries?

	for(const filter of domFilters){
		
		switch (filter.name) {
			case 'asteroids':
				filters.asteroids = filter.checked;				
				break;
			case 'centaurs':
				filters.centaurs = filter.checked;
				break;
			case 'comets':
				filters.comets = filter.checked;
				break;
			case 'interstellar-objects':
				filters.interestellarObjects = filter.checked;
				break;
			case 'near-earth-objects':
				filters.nearEarthObjects = filter.checked;
				break;
			case 'trans-neptunian-objects':
				filters.transNeptunianObjects = filter.checked;
				break;
			case 'planets-moons':
				filters.planets = filter.checked;
				break;

			default:
				break;
		}
	}
	return filters;
}

export async function getSolarSystemElementsByFilter(
	filters:Filters = 
	{
		asteroids:true,
		centaurs:true,
		comets:true,
		interestellarObjects:true,
		nearEarthObjects:true,
		transNeptunianObjects:true,
		planets: true
	}
) {
	
	const url = `${solarSystemElementsURL}/orbit-elements-by-filter/${solarSystemElementsLimit}/${filters.asteroids}/${filters.centaurs}/${filters.comets}/${filters.interestellarObjects}/${filters.nearEarthObjects}/${filters.transNeptunianObjects}`;	

	// Todo si planets false amagar els planetes
	// si planets true ensenyar els planetes

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': '_qfq_tMbyR4brJ@KHCzuJRU7'
		}
	})
	return await response.json();
}
