import { Input } from "./Input";


export class DoubleRange extends Input {
	range
	addEventListeners(): void {
		// const handles = this.dom.querySelectorAll('label');
		const near = this.dom.querySelector('input[name="near"]') as HTMLInputElement;
		const far = this.dom.querySelector('input[name="far"]') as HTMLInputElement;
		
		let lastNearValue = near.value;
		let lastFarValue = far.value;

		const offset = 0.07;

		near.addEventListener('input', (e) => {
			if(parseFloat(near.value) >= parseFloat(far.value) - offset) near.value = lastNearValue;
			else lastNearValue = near.value;
			this.dom.style.setProperty('--range-1', near.value)
		})
		far.addEventListener('input', (e) => {
			if(parseFloat(far.value) - offset <= parseFloat(near.value)) far.value = lastFarValue;
			else lastFarValue = far.value;			
			this.dom.style.setProperty('--range-2', far.value)

		})
		
	}
}