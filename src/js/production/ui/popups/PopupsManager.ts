import { CameraManager } from "../../../common/core/CameraManager";
import { SUN } from "../../../common/core/CoreApp";
import { particles } from "../../../common/solar/SolarParticlesManager";
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
	particles.highlighted = false;
	RAYCASTER.active = false;
	document.body.classList.add('ui-block');
	SUN.instance.highlight = true;
}

export function onHide() {
	CameraManager.unlock();
	particles.highlighted = true;
	RAYCASTER.active = true;
	SUN.instance.highlight = false;
	document.body.classList.remove('ui-block');
}

export const resizePopups = () => {
	for(const popup of popups) popup.onResize();
}
