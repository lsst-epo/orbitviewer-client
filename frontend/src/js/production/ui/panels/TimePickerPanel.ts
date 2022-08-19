import { Panel } from "./Panel";


export class TimePickerPanel extends Panel {
	thumb: HTMLButtonElement;

	constructor(id){
		super(id);

		this.thumb = this.dom.querySelector('.time-picker-trigger');
	}

	addEventListeners(){
		
		// Panel Buttons
		const buttons = document.querySelectorAll(`[data-panel-button="${this.id}"]`);
		if(buttons.length === 0) return;

		for(const button of buttons){
			button.addEventListener('click', (e) => {
				
				if(button === this.thumb && this.active) {
					e.preventDefault();					
					return;
				}
				
				this.togglePanel();
			})
		}

	}
}