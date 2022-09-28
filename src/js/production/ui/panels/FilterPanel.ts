import { addFiltersListener, applyFilters, FiltersListener, syncFilters } from "../../../common/data/FiltersManager";
import { Panel } from "./Panel";


export class FilterPanel extends Panel implements FiltersListener {
	buttonApply:HTMLButtonElement;
	filters:NodeListOf<HTMLInputElement>

	constructor(id){
		super(id);

		addFiltersListener(this);
	}

	create(){
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

	togglePanel(): void {
		super.togglePanel();

		if(!this.active) return;
		syncFilters(this.filters);
	}

	applyFilters(){
		applyFilters(this.filters);
	}

	syncFilters(): void {
		syncFilters(this.filters);
	}
	
}