import { CameraManager } from "../../../common/core/CameraManager";
import { CoreAppSingleton } from "../../../common/core/CoreApp";
import { Popup } from "./Popup";
import { RAYCASTER } from "./Raycaster";

export const popups: Array<Popup> = [];

export const initPopups = () => {;

	const items = document.querySelectorAll('.popup');

	for(const item of items){	
		popups.push(new Popup(item));
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

export const resizePopups = () => {
	for(const popup of popups) popup.onResize();
}
