import { CameraManager } from "../../../common/core/CameraManager";
import { particles } from "../../../common/solar/SolarParticlesManager";
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
	particles.highlighted = false;
	RAYCASTER.active = false;
}

export function onHide() {
	CameraManager.unlock();
	particles.highlighted = true;
	RAYCASTER.active = true;
}

export const resizeExpandableItems = () => {
	for(const expandableItem of expandableItems) expandableItem.onResize();
}
