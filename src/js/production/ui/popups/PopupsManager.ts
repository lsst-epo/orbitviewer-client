import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CameraManager } from "../../../common/core/CameraManager";
import { CoreAppSingleton } from "../../../common/core/CoreApp";
import { OrbitControlsIn, OrbitControlsOut } from "../../pagination/animations/OrbitControls";
import { LOCATION } from "../../pagination/History";
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
	CoreAppSingleton.instance.lock();
	hideUI();
}

export function onHide() {
	CameraManager.unlock();
	RAYCASTER.active = true;
	CoreAppSingleton.instance.unlock();
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
