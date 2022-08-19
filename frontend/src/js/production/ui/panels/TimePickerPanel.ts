import { Panel } from "./Panel";

enum STATE {
	HIDDEN,
	ACTIVE,
	EDIT
}

export class TimePickerPanel extends Panel {
	thumb: HTMLButtonElement;

	date: Date; 
	domDate: HTMLElement;

	reset: HTMLButtonElement;
	edit: HTMLButtonElement;

	state: STATE = 0;


	constructor(id){
		super(id);

		this.thumb = this.dom.querySelector('.time-picker-trigger');


		// Date handler
		this.date = new Date();
		this.domDate = this.dom.querySelector('.time-picker-details p span');
		this.updateTimer();
	}

	updateTimer(){

	}

	togglePanel(): void {
		super.togglePanel();

		this.state = this.active ? 1 : 0;

		if(this.state > 0){
			this.thumb.classList.add('disabled');
		} else {
			this.thumb.classList.remove('disabled');
		}
	}

	reposition(){
		// Todo reposicionar timer
		console.log('Reposition timer');
		
	}

	addEventListeners(){

		super.addEventListeners();

		window.addEventListener('resize', this.reposition.bind(this));
		this.reposition();

		// States buttons
		const buttonsZone = this.dom.querySelector('.time-picker-details');

		this.reset = buttonsZone.querySelector('[data-timer="reset"]');
		this.edit = buttonsZone.querySelector('[data-timer="edit"]');

		console.log(buttonsZone);
		

		this.reset.addEventListener('click', () => {
			console.log('Reset');
			return;
			
			this.state = 1;
			this.date = new Date();
			this.updateTimer();
		})

		this.edit.addEventListener('click', () => {
			console.log('Edit');
			return;
			
			this.state = 2;
			// todo fer sortir la zona d'edit
		})
	}
}