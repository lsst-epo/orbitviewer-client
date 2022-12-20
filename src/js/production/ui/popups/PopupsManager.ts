import gsap from "gsap";
import { CameraManager } from "../../../common/core/CameraManager";
import { CoreAppSingleton, solarClock } from "../../../common/core/CoreApp";
import { DEV } from "../../../common/core/Globals";
import { SolarElement } from "../../../common/solar/SolarElement";
import { OrbitDataElements } from "../../../common/solar/SolarUtils";
import { OrbitControlsIn, OrbitControlsOut } from "../../pagination/animations/OrbitControls";
import { LOCATION } from "../../pagination/History";
import { shareInit } from "../../partials/Share";
import { broadcastPanelsClose } from "../panels/PanelsManager";
import { PopupInfo } from "./PopupInfo";
import { PopupLabel } from "./PopupLabel";

export interface PopupInterface {
 name: string, 
 visible: boolean, 
 category: string, 
 label: PopupLabel, 
 info: PopupInfo
}

export const popups: Array<PopupInterface> = [];

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

	shareInit(document.querySelector('.popups-infos'));

}

export const linkSolarElementToPopup = (solarElement:SolarElement, data:OrbitDataElements) => {
	const popup = popups.find(x => x.name === solarElement.name);        
	    
	if(!popup) {
		if(DEV) console.log('No popup by this name', solarElement.name);
		return;
	}

	const cmsCategory = popup.label.dom.getAttribute('data-category');
	solarElement.category = cmsCategory;
	popup.category = solarElement.category;
	popup.label.ref = solarElement;
	popup.info.data = data;
}

export const popupsLoaded = () => {
	for(const popup of popups) {
		popup.label.loaded();
		popup.info.loaded();
		popup.visible = true;
	}
}

export function enablePopup(name: string, info: boolean = true) {
	
	CoreAppSingleton.instance.lock();
	
	solarClock.pause();
	broadcastPanelsClose();

	const popup = popups.find(x => x.name === name);
	if(!popup) return
	popup.label.select();

	if(info) {
		popup.info.show(popup.label.ref.closeUp);
	} 
		
	for(const _popup of popups){
		if(_popup === popup) continue;
		_popup.label.dom.classList.add('other-selected-hidden');
	}

	document.body.classList.add('popups-selected');

	hideUI();
}

export function disablePopup() {	
	
	for(const popup of popups) {	
		popup.label.dom.classList.remove('other-selected-hidden')	
		popup.label.dom.classList.remove('no-info-hidden')	
		popup.label.unselect();
		popup.info.hide();
	}

	CameraManager.unlock();
	CoreAppSingleton.instance.unlock();

	solarClock.resume()

	document.body.classList.remove('popups-selected');


	showUI();
}

export const updatePopups = () => {
	for(const popup of popups) {
		if(popup.visible) popup.label.dom.classList.remove('hidden')
		else popup.label.dom.classList.add('hidden')

		popup.label.update();
	}
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
