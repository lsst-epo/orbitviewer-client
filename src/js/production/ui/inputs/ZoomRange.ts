import { MathUtils } from "@jocabola/math";
import { CONTROLS } from "../../../common/core/Globals";
import { Input } from "./Input";

export class ZoomRange extends Input {
	value:number = 0;

	changing:boolean = false;

	addEventListeners(): void {
		
		this.value = this.dom.valueAsNumber;		

		this.dom.addEventListener('input', (e) => {
			this.changing = true;

			this.value = this.dom.valueAsNumber;
			
		})
		this.dom.addEventListener('change', (e) => {
		
			CONTROLS.orbit.minDistance = CONTROLS.min;
			CONTROLS.orbit.maxDistance = CONTROLS.max;

			this.changing = false;

		})

	}

	updateZoomClass(value){
		if(value > 0.2) document.body.classList.add('zoom-out');
		else document.body.classList.remove('zoom-out');
	}

	update(){
			
		// If it's changing update controls with new value

		if(this.changing){

			const value = MathUtils.map(this.value, 0, 1, CONTROLS.min, CONTROLS.max);			
			CONTROLS.orbit.minDistance = value - 0.0000000000001;
			CONTROLS.orbit.maxDistance = value + 0.0000000000001;
			
			this.updateZoomClass(this.value);

			return;
		}

		// Update input with current zoom value
		const distance = CONTROLS.orbit.getDistance();
		const value = MathUtils.map(distance, CONTROLS.min, CONTROLS.max, 0, 1);
		this.dom.value = value.toString();
		this.updateZoomClass(value);


		
		
		
	}

}