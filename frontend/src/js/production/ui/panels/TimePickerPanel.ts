import { MathUtils } from "@jocabola/math";
import { Panel } from "./Panel";

enum STATE {
	HIDDEN,
	ACTIVE,
	EDIT
}

export class TimePickerPanel extends Panel {
	thumb: HTMLButtonElement;
	subPanel: HTMLElement;

	date: Date; 
	domDate: HTMLElement;

	reset: HTMLButtonElement;
	edit: HTMLButtonElement;

	state: STATE = 0;

	range: HTMLInputElement;
	value: number = 0;
	holding: boolean = false;


	constructor(id){
		super(id);

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
			this.thumb.querySelector('.time-picker-trigger').classList.add('disabled');
		} else {
			this.subPanel.classList.remove('active');
			this.thumb.querySelector('.time-picker-trigger').classList.remove('disabled');
		}
	}

	reposition(){
		// Todo reposicionar timer
		console.log('Reposition timer');
		
	}

	addEventListeners(){

		super.addEventListeners();

		this.thumb = this.dom.querySelector('.time-picker');
		this.range = this.dom.querySelector('.time-picker-input input');
		this.subPanel = this.dom.querySelector('.sub-panel');

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
			this.state = 2;
			this.subPanel.classList.add('active');
		})


		this.range.addEventListener('input', () => {
			this.holding = true;
			this.value = parseFloat(this.range.value);
		})

		this.range.addEventListener('change', () => {
			this.holding = false;
		})
	}

	update(){
		if(!this.active) return;

		this.value = parseFloat(this.range.value);
		

		if(!this.holding){
			this.value = MathUtils.lerp(this.value, 0, 0.03);
			this.range.value = this.value.toString();
		}

		this.thumb.style.transform = `translateX(${45 * this.value}%)`;
		
		
	}
}