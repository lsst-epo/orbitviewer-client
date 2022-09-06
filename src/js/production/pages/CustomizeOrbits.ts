import { onChange } from "../pagination/History";
import { Page } from "./Page";


export class CustomizeOrbits extends Page {
	addEventListeners(): void {
	
		this.addBackButton();
		
	}

	addBackButton(){
		const btn = this.dom.querySelector('[data-button="customize-orbits-button"]');

		btn.addEventListener('click', (e) => {
			e.preventDefault();
			onChange('/orbit-viewer');
		})
	}


}