import { Input } from "./Input";

export class Range extends Input {

	addEventListeners(): void {
		console.log('hola?');
		
		this.dom.addEventListener('input', (e) => {
			// console.log(this.dom.value);
		})
	}

}