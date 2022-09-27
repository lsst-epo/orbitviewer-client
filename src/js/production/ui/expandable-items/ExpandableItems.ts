import { ExpandableItem } from "./ExpandableItem";

export const expandableItems: Array<ExpandableItem> = [];

export const initExpandableItems = () => {;

	const items = document.querySelectorAll('.expandable-item');

	for(const item of items){	
		expandableItems.push(new ExpandableItem(item));
	}

}

export const resizeExpandableItems = () => {
	for(const expandableItem of expandableItems) expandableItem.onResize();
}
