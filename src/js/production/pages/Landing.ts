import { LOCATION } from "../pagination/History";
import { Page } from "./Page";


export class Landing extends Page {

	hide(): void {
		// Skip filters page the second timer around
		if(LOCATION.current.id != 'customize-orbits') return;
		
		const btn = this.dom.querySelector('.orbit-button');
		btn.setAttribute('href', btn.getAttribute('data-href'));
	}


}