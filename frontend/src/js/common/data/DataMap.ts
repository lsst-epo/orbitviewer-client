import { dataMap, loadEntry, registerDataEntry } from "./DataManager";

const baseUrl = '../uploads/data/';

function addItem(id: string, url: string) {
	registerDataEntry(id, `${baseUrl}${url}`);
}

export function loadData(onComplete: Function = () => {}) {
	
	let loaded = 0;

	// ---- Add Items -------------------------
	addItem('globals', 'globals.json');
	// ----------------------------------------

  console.log(dataMap.length);
    

	const onL = () => {
		loaded++;
		if (loaded == dataMap.length) onComplete();
	};

	for (const d of dataMap) {
		loadEntry(d, onL);
	}
}
