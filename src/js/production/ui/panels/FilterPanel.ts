import { Filters, getSelectedFilters, getSolarSystemElementsByFilter } from "../../../common/data/GetData";
import { buildSimWithData } from "../../../common/solar/SolarParticlesManager";
import { Panel } from "./Panel";


export class FilterPanel extends Panel {
	buttonApply:HTMLButtonElement;
	filters:NodeListOf<HTMLInputElement>

	create(){
		this.filters = this.dom.querySelectorAll('.categories-filter input[type="checkbox"]');
		this.buttonApply = this.dom.querySelector('[data-button="filters-apply"]');
	}

	addEventListeners(): void {
		super.addEventListeners();

		this.buttonApply.addEventListener('click', () => {
			this.applyFilters();
		})


	}

	applyFilters(){
		
		const filters:Filters = getSelectedFilters(this.filters);


		getSolarSystemElementsByFilter(filters).then( (res) => {
			console.log(res);
			
			const d = res.mpcorb;                                  
      buildSimWithData(d, false);
		});

	}
	
}