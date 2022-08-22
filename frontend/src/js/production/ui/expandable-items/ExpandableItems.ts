import { ExpandableItem } from "./ExpandableItem";

export const expandableItems: Array<ExpandableItem> = [];

export const initExpandableItems = () => {;

	const items = document.querySelectorAll('.expandable-item');

	for(const item of items){	
		expandableItems.push(new ExpandableItem(item));
	}

}

export const enableExpandableItem = (id: string) => {

	const item = expandableItems.find(x => x.id === id);
	
	if(!item){
		console.error('No expandable item with this id:', id);
		return;
	}

	item.enable();

}