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

	subPanelApply: HTMLButtonElement;
	subPanelCancel:HTMLButtonElement;


	constructor(id){
		super(id);

		this.updateTimer();
		this.reposition();

	}

	create(): void {

		// Date 
		this.date = new Date();
		this.domDate = this.dom.querySelector('.time-picker-details p span');

		// DOM
		this.thumb = this.dom.querySelector('.time-picker');
		this.range = this.dom.querySelector('.time-picker-input input');
		this.subPanel = this.dom.querySelector('.sub-panel');

		// Sub Panel Stuff
		const buttonsZone = this.dom.querySelector('.time-picker-details');

		this.reset = buttonsZone.querySelector('[data-timer="reset"]');
		this.edit = buttonsZone.querySelector('[data-timer="edit"]');

		this.subPanelApply = this.subPanel.querySelector('#apply-date');
		this.subPanelCancel = this.subPanel.querySelector('#close-edit');

	}

	updateTimer(){

	}

	togglePanel(): void {

		this.active = this.state > 0;
		if(this.active) this.dom.classList.add('active');
		else this.dom.classList.remove('active');

		if(this.state === 2) this.subPanel.classList.add('active');
		else this.subPanel.classList.remove('active');

		if(this.state > 0){
			this.thumb.querySelector('.time-picker-trigger').classList.add('disabled');
		} else {
			this.thumb.querySelector('.time-picker-trigger').classList.remove('disabled');
		}
	}

	reposition(){
		// Todo reposicionar timer
		console.log('Reposition timer');
		
	}

	addEventListeners(){

		const buttons = document.querySelectorAll(`[data-panel-button="${this.id}"]`);
		if(buttons.length === 0) return;

		for(const button of buttons){
			button.addEventListener('click', () => { 		
				if(this.active) this.state = 0;
				else this.state = 1;

				this.togglePanel();
			})
		}

		window.addEventListener('resize', this.reposition.bind(this));

		this.reset.addEventListener('click', () => {
			console.log('Reset');
			return;
			
			this.state = 1;
			this.date = new Date();
			this.updateTimer();
		})

		this.edit.addEventListener('click', () => {
			this.state = 2;
			this.togglePanel();
		})


		this.range.addEventListener('input', () => {
			this.holding = true;
			this.value = parseFloat(this.range.value);
		})

		this.range.addEventListener('change', () => {
			this.holding = false;
		})

		this.subPanelApply.addEventListener('click', () => {
			this.updateTimer();
			this.state = 1;
			this.togglePanel();
		})

		this.subPanelCancel.addEventListener('click', () => {
			// Todo reset data
			this.state = 1;
			this.togglePanel();
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