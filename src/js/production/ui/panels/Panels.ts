import { FilterPanel } from "./FilterPanel";
import { LanguagePanel } from "./LanguagePanel";
import { Panel } from "./Panel";
import { broadcastPanelsClose } from "./PanelsManager";
import { ResolutionPanel } from "./ResolutionPanel";
import { TimePickerPanel } from "./TimePickerPanel";
import { TourSortPanel } from "./TourSortPanel";

export class Panels {
	dom: HTMLElement;
	panels: Array<Panel> = [];
	constructor(dom: HTMLElement = null){
		if(!!!dom) return;

		this.dom = dom;
		
		this.createPanels();
		this.addListeners();

	}

	createPanels(){

		const panels = this.dom.querySelectorAll('[data-panel]');

		for(const item of panels){

			const id = item.getAttribute('data-panel');
			if(!!!item) continue;

			let panel = null
			if(id === 'time-picker') panel = new TimePickerPanel(id);
			else if(id.includes('tour-sort')) panel = new TourSortPanel(id);
			else if(id.includes('lang')) panel = new LanguagePanel(id);
			else if(id.includes('filters')) panel = new FilterPanel(id);
			else if(id.includes('resolution')) panel = new ResolutionPanel(id);
			else panel = new Panel(id);

			this.panels.push(panel);
		}		

	}

	onResize(){
		for(const p of this.panels) p.onResize();
	}

	addListeners(){

		document.addEventListener('keydown', (e) => {			
			if(e.key != 'Escape') return;
			broadcastPanelsClose();
		})

	}

	update(){					
		for(const p of this.panels) p.update();
	}
}