import { CLOCK_SETTINGS } from "../../../common/core/Globals";
import { Input } from "./Input";

export class TimePickerRange extends Input {
	value:number = 0;

	changing:boolean = false;

	addEventListeners(): void {

		this.dom.addEventListener('input', (e) => {
			this.changing = true;
		})
		this.dom.addEventListener('change', (e) => {
			this.changing = false;
		})

	}

	update(){

		this.value = this.dom.valueAsNumber;
		// CLOCK_SETTINGS.backwards = this.value < 0;
		CLOCK_SETTINGS.speed = this.value * CLOCK_SETTINGS.maxSpeed;
		
	}

}