import { io } from '@jocabola/io';

export type DataEntry = {
	id: string;
	url: string;
	data?: JSON;
};

export const dataMap: Array<DataEntry> = [];

export function getEntryById(id: string): DataEntry {
	const d = dataMap.find((x)=> x.id === id);
	return d;
}

export function registerDataEntry(id: string, url: string) {
	if (getEntryById(id) === undefined) {
		dataMap.push({
			id: id,
			url: url,
			data: null,
		});
	}
}

export function loadEntry(d: DataEntry, onLoaded: Function = () => {}) {
	io.load(
		d.url,
		(res) => {
			d.data = JSON.parse(res);
			onLoaded();
		},
		(r) => {
			console.error('Error Loading Data!', d.url);
		}
	);
}