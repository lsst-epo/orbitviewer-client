import { Color } from "three";
import { HASURA_URL } from "../core/Globals";
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

export const getCategory = (item: OrbitDataElements):SolarCategory => {
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

	if(!avail_categories.length) return categoriesSort[0];

	return categoriesSort[k];
}

export const CategoryColorMap:Record<SolarCategory,Color> = {
	'asteroids': new Color("#FDD56D"),
	'centaurs': new Color("#36B3FF"),
	'comets': new Color("#7EEA00"),
	'interstellar-objects': new Color("#A8F0ED"),
	'near-earth-objects': new Color("#FAAA58"),
	'planets-moons': new Color("#ffffff"),
	'trans-neptunian-objects': new Color("#98F79A")
}

export const CategoriesMinMaxA = {
	'total': {
		min: 0,
		max: 0
	},
	'planets-moons': {
		min: 0,
		max: 0
	},
	'asteroids': {
		min: 0,
		max: 0
	},
	'centaurs': {
		min: 0,
		max: 0
	},
	'comets': {
		min: 0,
		max: 0
	},
	'interstellar-objects': {
		min: 0,
		max: 0
	},
	'near-earth-objects': {
		min: 0,
		max: 0
	},
	'trans-neptunian-objects': {
		min: 0,
		max: 0
	}
}

// Filters fetch
export async function getA() {

	const url = `${HASURA_URL}/orbit-viewer/a`;	

	const response = await fetch(url, {
		headers: {
			'X-Hasura-Admin-Secret': '_qfq_tMbyR4brJ@KHCzuJRU7'
		}
	})
	return await response.json();
}

export async function getMinMaxAByCategory () {

	console.log('Loading "A"...');
	
	const data = await getA();

	CategoriesMinMaxA['planets-moons'].min = 0
	CategoriesMinMaxA['planets-moons'].max = 1;
	
	CategoriesMinMaxA['total'].min = data.min.length ? data.min[0].a : null;
	CategoriesMinMaxA['total'].max = data.max.length ? data.max[0].a : null;
	
	CategoriesMinMaxA['asteroids'].min = data.asteroidsMin.length ? data.asteroidsMin[0].a : null;
	CategoriesMinMaxA['asteroids'].max = data.asteroidsMax.length ? data.asteroidsMax[0].a : null;

	CategoriesMinMaxA['centaurs'].min = data.centaursMin.length ? data.centaursMin[0].a : null;
	CategoriesMinMaxA['centaurs'].max = data.centaursMax.length ? data.centaursMax[0].a : null;

	CategoriesMinMaxA['comets'].min = data.cometsMin.length ? data.cometsMin[0].a : null;
	CategoriesMinMaxA['comets'].max = data.cometsMax.length ? data.cometsMax[0].a : null;

	CategoriesMinMaxA['interstellar-objects'].min = data.isoMin.length ? data.isoMin[0].a : null;
	CategoriesMinMaxA['interstellar-objects'].max = data.isoMax.length ? data.isoMax[0].a : null;
		
	CategoriesMinMaxA['near-earth-objects'].min = data.neoMin.length ? data.neoMin[0].a : null;
	CategoriesMinMaxA['near-earth-objects'].max = data.neoMax.length ? data.neoMax[0].a : null;
		
	CategoriesMinMaxA['trans-neptunian-objects'].min = data.tnoMin.length ? data.tnoMin[0].a : null;
	CategoriesMinMaxA['trans-neptunian-objects'].max = data.tnoMax.length ? data.tnoMax[0].a : null;

	console.log('"A" Loaded:', CategoriesMinMaxA);
	

}