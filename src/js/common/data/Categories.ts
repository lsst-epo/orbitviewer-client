import { OrbitDataElements } from "../solar/SolarUtils";

export type SolarCategory = 'trans-neptunian-objects'|'near-earth-objects'|'interstellar-objects'|'comets'|'centaurs'|'asteroids'|'planets-moons';

export const getCategory = (item: OrbitDataElements) => {

	let category = '';

	for(const property in item){		

		switch(property){

			case 'is_tno':
				if(!item[property])	break;
				category = 'trans-neptunian-objects';
				break;
			case 'is_neo':
				if(!item[property])	break;
				category = 'near-earth-objects';
				break;
			case 'is_iso':
				if(!item[property])	break;
				category = 'interstellar-objects';
				break;
			case 'is_comet':
				if(!item[property])	break;
				category = 'comets';
				break;
			case 'is_centaur':
				if(!item[property])	break;
				category = 'centaurs';
				break;
			case 'is_asteroid':
				if(!item[property])	break;
				category = 'asteroids';
				break;
		}

	}

	return category;
}