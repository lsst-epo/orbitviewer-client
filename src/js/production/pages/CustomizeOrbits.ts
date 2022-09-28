import { Filters, getSelectedFilters, getSolarSystemElementsByFilter, saveSelectedFilters, syncFilters } from "../../common/data/GetData";
import { buildSimWithData } from "../../common/solar/SolarParticlesManager";
import { onChange } from "../pagination/History";
import { Search } from "../partials/Search";
import { expandableItems } from "../ui/expandable-items/ExpandableItems";
import { RAYCASTER } from "../ui/expandable-items/Raycaster";
import { Page } from "./Page";


export class CustomizeOrbits extends Page {
	buttonApply:HTMLButtonElement;
	filters:NodeListOf<HTMLInputElement>;
	
	onLoaded(): void {
		this.filters = this.dom.querySelectorAll('.categories-filter input[type="checkbox"]');
		syncFilters(this.filters);
		this.buttonApply = this.dom.querySelector('[data-button="filters-apply"]');
	}

	addEventListeners(): void {
		super.addEventListeners();

		this.buttonApply.addEventListener('click', () => {
			this.applyFilters();
		})
	}

	applyFilters(){

		const needsUpdate = saveSelectedFilters(this.filters);

		console.log(needsUpdate);
		
		if(!needsUpdate) return;

		getSolarSystemElementsByFilter().then( (res) => {		
			const d = res.mpcorb;                                  
      buildSimWithData(d, false);
		});

	}
}