import { CameraManager } from "../../../common/core/CameraManager";
import { CoreAppSingleton } from "../../../common/core/CoreApp";
import { ExpandableItem } from "./ExpandableItem";
import { RAYCASTER } from "./Raycaster";

export const expandableItems: Array<ExpandableItem> = [];

export const initExpandableItems = () => {;

	const items = document.querySelectorAll('.expandable-item');

	for(const item of items){	
		expandableItems.push(new ExpandableItem(item));
	}

}

export function onShow() {
	RAYCASTER.active = false;
	document.body.classList.add('ui-block');
	CoreAppSingleton.instance.lock();
}

export function onHide() {
	CameraManager.unlock();
	RAYCASTER.active = true;
	document.body.classList.remove('ui-block');
	CoreAppSingleton.instance.unlock();
}

export const resizeExpandableItems = () => {
	for(const expandableItem of expandableItems) expandableItem.onResize();
}
