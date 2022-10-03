import { push } from "../../../data/locales";
import { OrbitDataElements } from "../solar/SolarUtils";

export type SolarCategory = 'trans-neptunian-objects'|'near-earth-objects'|'interstellar-objects'|'comets'|'centaurs'|'asteroids'|'planets-moons';

/**
 * Sorted by pririty (lowest index in the array holds higher priority)
 */
export const categoriesSort:Array<SolarCategory> = [
	'asteroids',
	'comets',
	'centaurs',
	'interstellar-objects',
	'near-earth-objects',
	'trans-neptunian-objects'
]

export const getCategory = (item: OrbitDataElements) => {
	const avail_categories:Array<SolarCategory> = [];

	if(item.is_tno) avail_categories.push('trans-neptunian-objects');
	if(item.is_neo) avail_categories.push('near-earth-objects');
	if(item.is_iso) avail_categories.push('interstellar-objects');
	if(item.is_comet) avail_categories.push('comets');
	if(item.is_centaur) avail_categories.push('centaurs');
	if(item.is_asteroid) avail_categories.push('asteroids');

	let k = 100;
	for (const id of avail_categories) {
		const p = categoriesSort.indexOf(id);
		if(p < k) k = p;
	}

	return categoriesSort[k];
}

export const CategoryColorMap:Record<SolarCategory,string> = {
	'asteroids': "#FDD56D",
	'centaurs': "#36B3FF",
	'comets': "#7EEA00",
	'interstellar-objects': "#A8F0ED",
	'near-earth-objects': "#FAAA58",
	'planets-moons': "#ffffff",
	'trans-neptunian-objects': "#98F79A"
}