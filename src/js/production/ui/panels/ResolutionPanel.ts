import { VISUAL_SETTINGS } from "../../../common/core/Globals";
import { getSolarSystemElementsByFilter } from "../../../common/data/FiltersManager";
import { buildSimWithData } from "../../../common/solar/SolarParticlesManager";
import { hideLoader } from "../loader";
import { Panel } from "./Panel";


export class ResolutionPanel extends Panel {
	buttonApply:HTMLButtonElement;
	buttonReset:HTMLButtonElement;
	options:NodeListOf<HTMLInputElement>
	original:string;
	
	create(){

		this.original = VISUAL_SETTINGS.current;

		this.options = this.dom.querySelectorAll('input[type="radio"]');
		this.buttonApply = this.dom.querySelector('[data-button="resolution-apply"]');
		this.buttonReset = this.dom.querySelector('[data-button="resolution-reset"]');

		const active = this.dom.querySelector(`[value="${this.original}"]`) as HTMLElement;		
		active?.click();

	}

	addEventListeners(): void {
		super.addEventListeners();

		this.buttonApply.addEventListener('click', () => {
			this.applyResolution();
		})

	}

	applyResolution(){
		
		let active = null;
		for(const option of this.options){			
			if(option.checked) active = option;
		}
		if(!active) return;

		if(active.value === VISUAL_SETTINGS.current) return;

		VISUAL_SETTINGS.current = active.value;

		getSolarSystemElementsByFilter().then((res) => {
			const d = res.mpcorb;                                  
			buildSimWithData(d, false);
			hideLoader();
		}).catch(() => {
			alert('Database fetch error.')
		});
	}

	
}