import { HASURA_URL } from "../core/Globals";


async function fetchSolarElement (id: string ) {

	const url = `${HASURA_URL}/orbit-viewer/fetch/${id}`;		

	const response = await fetch(url, {
		headers: { 
			'X-Hasura-Admin-Secret': process.env.HASURA_SECRET_KEY
		}
	})

	let res = await response.json();
	res = res.mpcorb[0];
	res.id = id;

	return res;
}

export async function fetchSolarElements(elements:Array<any>){

	let ids = [];
	for(const el of elements){
		const id = el.elementID;
		ids.push(id);
	}	


	const promises = [];
	for(const id of ids){
		promises.push(fetchSolarElement(id))
	}
	
	const items = await Promise.all(promises);

	if(!items) return [];

	return items;
}