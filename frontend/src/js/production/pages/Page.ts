import { Inputs } from "../utils/inputs/Inputs";
import { Panels } from "../utils/Panel";

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
		resolve();	
	}
	
	disable () {
		this.active = false;
	}

	load(resolve){				
		this.loaded = true;	
		this.addEventListeners();
		this.addInputs();
		this.addPanels();

		this.enable(resolve);
	}

	addInputs(){
		new Inputs(this.dom);
	}

	addPanels(){
		new Panels(this.dom);
	}

	addEventListeners(){

	}

	onResize(){
		if(!this.active) return;
		console.log('Page Resize');
	}

	update(){
		if(!this.active || !this.loaded) return;		
	}
}