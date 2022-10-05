import gsap from "gsap";
import { CameraManager } from "../../../common/core/CameraManager";
import { CoreAppSingleton, solarClock } from "../../../common/core/CoreApp";
import { SolarElement } from "../../../common/solar/SolarElement";
import { OrbitDataElements } from "../../../common/solar/SolarUtils";
import { OrbitControlsIn, OrbitControlsOut } from "../../pagination/animations/OrbitControls";
import { LOCATION } from "../../pagination/History";
import { broadcastPanelsClose } from "../panels/PanelsManager";
import { PopupInfo } from "./PopupInfo";
import { PopupLabel } from "./PopupLabel";
import { RAYCASTER } from "./Raycaster";

export const popups: Array<{name: string, visible: boolean, category: string, label: PopupLabel, info: PopupInfo}> = [];

export const initPopups = () => {;

	const items = document.querySelectorAll('.popup-label');	

	// Disable popups
	const closePopups = document.querySelector('.popups-close');
	closePopups.addEventListener('click', () => {
		disablePopup();
	})

	for(const item of items){	

		const name = item.getAttribute('data-name');
		const infoItem = document.querySelector(`.popup-info[data-name="${name}"]`);		

		popups.push({
			name,
			visible: false,
			category: '',
			label: new PopupLabel(item),
			info: new PopupInfo(infoItem)
		});
		
	}
}

export const linkPlanetToPopup = (solarElement:SolarElement, data:OrbitDataElements) => {
	const popup = popups.find(x => x.name === solarElement.name);            
	if(popup) {
		popup.category = solarElement.category;
		popup.label.ref = solarElement;
		popup.info.data = data;
	}
}

export const popupsLoaded = () => {
	for(const popup of popups) {
		popup.label.loaded();
		popup.info.loaded();
		popup.visible = true;
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

	document.body.classList.add('popups-active');

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
	document.body.classList.remove('popups-active');

	RAYCASTER.active = true;

	showUI();
}

export const resizePopups = () => {
	for(const popup of popups) {
		// popup.label.onResize();
		popup.info.onResize();
	}
}

export const applyAFieldToPopups = () => {
	// Already did that with fake data
	// Todo
	return;
	for(const popup of popups){
		popup.info.addAData();
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
