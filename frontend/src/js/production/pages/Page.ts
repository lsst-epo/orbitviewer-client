import { Inputs } from "../utils/inputs/Inputs";

export class Page {
	dom:HTMLElement = null;
	active:boolean = false;
	loaded:boolean = false;
	hasUI:boolean = false;

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

		if(this.hasUI) {
			document.body.classList.add('ui-active');
		} else document.body.classList.remove('ui-active');

		this.enable(resolve);
	}

	addInputs(){
		new Inputs(this.dom);
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