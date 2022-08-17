import { Input } from "./Input";


export class DoubleRange extends Input {
	range
	addEventListeners(): void {
		// const handles = this.dom.querySelectorAll('label');
		const near = this.dom.querySelector('input[name="near"]');
		const far = this.dom.querySelector('input[name="far"]');
		
		let lastNearValue = near.value;
		let lastFarValue = far.value;

		const offset = 0.07;

		near.addEventListener('input', (e) => {
			if(near.value >= far.value - offset) near.value = lastNearValue;
			else lastNearValue = near.value;
			this.dom.style.setProperty('--range-1', near.value)
		})
		far.addEventListener('input', (e) => {
			if(far.value - offset <= near.value) far.value = lastFarValue;
			else lastFarValue = far.value;			
			this.dom.style.setProperty('--range-2', far.value)

		})
		
	}
}