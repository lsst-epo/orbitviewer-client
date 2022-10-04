import gsap from "gsap";
import { CameraManager } from "../../../common/core/CameraManager";
import { CoreAppSingleton, solarClock } from "../../../common/core/CoreApp";
import { OrbitControlsIn, OrbitControlsOut } from "../../pagination/animations/OrbitControls";
import { LOCATION } from "../../pagination/History";
import { broadcastPanelsClose } from "../panels/PanelsManager";
import { PopupInfo } from "./PopupInfo";
import { PopupLabel } from "./PopupLabel";
import { RAYCASTER } from "./Raycaster";

export const popups: Array<{name: string, label: PopupLabel, info: PopupInfo}> = [];


export const initPopups = () => {;

	const items = document.querySelectorAll('.popup-label');	

	for(const item of items){	

		const name = item.getAttribute('data-name');
		const infoItem = document.querySelector(`.popup-info[data-name="${name}"]`);

		popups.push({
			name,
			label: new PopupLabel(item),
			info: new PopupInfo(infoItem)
		});
	}

}

export function enablePopup(name: string) {
	
	RAYCASTER.active = false;
	CoreAppSingleton.instance.lock();

	document.querySelector('.popups-labels').classList.add('hidden');

	solarClock.pause();
	broadcastPanelsClose();

	for(const popup of popups) {
		
		if(popup.name === name) {
			popup.label.select();
			popup.info.show();
		}
	}

	hideUI();
}

export function disablePopup() {	
	
	for(const popup of popups) {		
		popup.label.unselect();
		popup.info.hide();
	}

	CameraManager.unlock();
	CoreAppSingleton.instance.unlock();

	solarClock.resume();

	document.querySelector('.popups-labels').classList.remove('hidden');

	RAYCASTER.active = true;

	showUI();
}

export const resizePopups = () => {
	for(const popup of popups) {
		// popup.label.onResize();
		popup.info.onResize();
	}
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
