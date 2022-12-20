import { addFiltersListener, applyFilters, FiltersListener, resetFilters, syncFilters } from "../../../common/data/FiltersManager";
import { Panel } from "./Panel";


export class FilterPanel extends Panel implements FiltersListener {
	buttonApply:HTMLButtonElement;
	buttonReset:HTMLButtonElement;
	filters:NodeListOf<HTMLInputElement>

	constructor(id){
		super(id);

		addFiltersListener(this);
	}

	create(){
		this.filters = this.dom.querySelectorAll('.filters input[type="checkbox"]');
		syncFilters(this.filters);

		this.buttonApply = this.dom.querySelector('[data-button="filters-apply"]');
		this.buttonReset = this.dom.querySelector('[data-button="filters-reset"]');
	}

	addEventListeners(): void {
		super.addEventListeners();

		this.buttonApply.addEventListener('click', () => {
			this.applyFilters();
		})
		this.buttonReset.addEventListener('click', () => {
			this.resetFilters();
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

	resetFilters(): void {
		resetFilters();
	}

	syncFilters(): void {
		syncFilters(this.filters);
	}
	
}