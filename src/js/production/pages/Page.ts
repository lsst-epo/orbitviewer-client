import { solarClock } from "../../common/core/CoreApp";
import { shareInit } from "../partials/Share";
import { Inputs } from "../ui/inputs/Inputs";
import { Panels } from "../ui/panels/Panels";
import { broadcastPanelsClose } from "../ui/panels/PanelsManager";

export class Page {
	dom:HTMLElement = null;
	active:boolean = false;
	loaded:boolean = false;

	panels:Panels;
	inputs:Inputs;

	prepare() {		
		this.active = true;
		return new Promise(resolve => {		
			if(this.loaded){			
				this.enable(resolve);
			} else {
				this.load(resolve);
			}
		})
	}

	enable(resolve){
		this.dom.classList.remove('disabled');
		this.show();
		resolve();	
	}

	show(){
		
	}

	hide(){		
		broadcastPanelsClose();
		solarClock.pause();
	}
	
	disable () {
		this.dom.classList.add('disabled');
		this.active = false;
	}

	load(resolve){				
		this.loaded = true;	
		this.onLoaded();
		this.addEventListeners();

		shareInit(this.dom);

		this.inputs = new Inputs(this.dom);
		this.panels = new Panels(this.dom);

		this.enable(resolve);
	}

	onLoaded(){

	}

	addEventListeners(){

	}

	onResize(){
		if(!this.active || !this.loaded) return;
		if(this.panels) this.panels.onResize();
	}

	update(){		
		if(!this.active || !this.loaded) return;				
		if(this.panels) this.panels.update();
		if(this.inputs) this.inputs.update();
	}
}