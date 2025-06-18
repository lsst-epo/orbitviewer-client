import { solarClock } from "../../common/core/CoreApp";
import { shareInit } from "../partials/Share";
import { addInputs, inputs } from "../ui/inputs/InputsManager";
import { addPanels, broadcastPanelsClose } from "../ui/panels/PanelsManager";

export class Page {
	dom:HTMLElement = null;
	active:boolean = false;
	loaded:boolean = false;

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
		for(const input of inputs) input.input.reset();
	}
	
	disable () {
		this.dom.classList.add('disabled');
		this.active = false;
	}

	load(resolve){			
			
		this.loaded = true;	

		shareInit(this.dom);

		addInputs();
		addPanels();

		this.onLoaded();
		this.addEventListeners();

		this.enable(resolve);
	}

	onLoaded(){

	}

	addEventListeners(){

	}

	onResize(){
		if(!this.active || !this.loaded) return;
	}

	update(){		
		if(!this.active || !this.loaded) return;				
	}
}