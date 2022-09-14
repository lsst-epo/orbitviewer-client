import { ExpandableItem } from "./ExpandableItem";

export const expandableItems: Array<ExpandableItem> = [];

export const initExpandableItems = () => {;

	const items = document.querySelectorAll('.expandable-item');

	console.log(items);
	

	// Fake add name
	let i = 0;

	for(const item of items){	

		item.setAttribute('data-name', `fake-${i}`)
		
		expandableItems.push(new ExpandableItem(item));

		i++;
	}

}

export const resizeExpandableItems = () => {
	for(const expandableItem of expandableItems) expandableItem.onResize();
}
