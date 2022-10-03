import gsap from "gsap";
import { Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CameraManager } from "../../../common/core/CameraManager";
import { CoreAppSingleton } from "../../../common/core/CoreApp";
import { OrbitControlsIn, OrbitControlsOut } from "../../pagination/animations/OrbitControls";
import { LOCATION } from "../../pagination/History";
import { css2D } from "./Css2D";
import { PopupLabel } from "./PopupLabel";
import { RAYCASTER } from "./Raycaster";

export const popups: Array<PopupLabel> = [];


export const initPopups = () => {;

	const items = document.querySelectorAll('.popup-label');	

	for(const item of items){	
		popups.push(new PopupLabel(item));
	}

}

export function enablePopup() {
	RAYCASTER.active = false;
	CoreAppSingleton.instance.lock();

	for(const popup of popups) popup.hide();

	hideUI();
}

export function disablePopup() {
	CameraManager.unlock();
	RAYCASTER.active = true;
	CoreAppSingleton.instance.unlock();
	
	for(const popup of popups) popup.show();

	showUI();
}

export const resizePopups = () => {
	for(const popup of popups) popup.onResize();
}

const hideUI = () => {

	const orbitControlsTl = gsap.timeline({
			paused: true,
			defaults: {
				duration: 0.2,
				ease: 'power1.inOut',
			},
		});
		orbitControlsTl.add('start')

	OrbitControlsOut(orbitControlsTl, 'start', LOCATION.current.class.dom);
	orbitControlsTl.play();

}

const showUI = () => {

	const orbitControlsTl = gsap.timeline({
			paused: true,
			defaults: {
				duration: 0.2,
				ease: 'power1.inOut',
			},
		});
		orbitControlsTl.add('start')
	OrbitControlsIn(orbitControlsTl, 'start');
	orbitControlsTl.play();

}
