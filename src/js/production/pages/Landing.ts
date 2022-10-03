import { addFiltersListener, applyFilters, FiltersListener, syncFilters } from "../../common/data/FiltersManager";
import { Page } from "./Page";


export class Landing extends Page {

	hide(): void {
		// Skip filters page the second timer around
		const btn = this.dom.querySelector('.orbit-button');
		btn.setAttribute('href', btn.getAttribute('data-href'));
	}


}