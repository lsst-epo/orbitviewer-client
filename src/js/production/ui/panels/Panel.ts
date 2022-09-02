

export class Panel {
	id:string;
	dom: HTMLElement;
	active: boolean = false;
	constructor(id){

		this.id = id;

		this.dom = document.querySelector(`[data-panel="${id}"]`);

		this.create();

		this.addEventListeners();
	}

	create(){
		
	}

	togglePanel(){		
		this.active = !this.active;
		this.dom.classList.toggle('active');

		if(this.active){
			this.dom.classList.add('to-front');
		} else {
			setTimeout(() => {
				this.dom.classList.remove('to-front');
			}, 500);
		}
	}
 
	addEventListeners(){
		// Panel Buttons
		const buttons = document.querySelectorAll(`[data-panel-button="${this.id}"]`);
		if(buttons.length === 0) return;		

		for(const button of buttons){
			button.addEventListener('click', () => { 								
				this.togglePanel();
			})
		}

	}

	update(){
		if(!this.active) return;
	}
}