import { solarClock } from "../../../common/core/CoreApp";
import { Panel } from "./Panel";
import { panels } from "./PanelsManager";
import { STATE, TimePickerPanel } from "./TimePickerPanel";

export class TimePickerSubPanel extends Panel {
	subPanelApply: HTMLButtonElement;
	subPanelCancel: HTMLButtonElement;
	subPanelInput: HTMLInputElement;

	create(): void {

		this.subPanelApply = this.dom.querySelector('[data-button="apply-date"]');
		this.subPanelCancel = this.dom.querySelector('[data-button="close-edit"]');
		this.subPanelInput = this.dom.querySelector('input[type="date"]');

		this.dateInputReset();
	}

	addEventListeners(): void {

			this.subPanelCancel.addEventListener('click', () => {
				this.closePanel(true);
			})

			this.subPanelApply.addEventListener('click', () => {
				this.closePanel(true);
				this.updateTimer();
			})
	}

	closePanel(openParent:boolean = false): void {
		super.closePanel();

		if(openParent){
			const panel = getParentPanel();
			panel.state = STATE.ACTIVE;
			setTimeout(() => {
				panel.changeState();
			}, 500);			
		}
	}

	updateTimer(){
		
		if(!!!this.subPanelInput.valueAsDate) {
			return;
		}		
		const date = new Date(this.subPanelInput.valueAsDate);		
		solarClock.setDate(date);
	}

	dateInputReset(){
		setTimeout(() => {
			const items = this.dom.querySelectorAll('.date-item h4') as NodeListOf<HTMLElement>;
			for(const item of items) item.innerText = item.getAttribute('data-empty');
		}, 500);
	}
}

const getParentPanel = ():TimePickerPanel => {
	const panel = panels.find(x => x.id === 'time-picker') as TimePickerPanel;	
	return panel;
}