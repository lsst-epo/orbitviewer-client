import { Input } from "./Input";


export class Checkbox extends Input {

	addEventListeners(): void {

		this.checkState();

		this.inputElement.addEventListener('change', (e) => {
			this.checkState();
		})
	}

	checkState(){
		const parent = this.inputElement.parentElement;
		const el = this.inputElement as HTMLInputElement;

		const checked = el.checked;

		if(checked){
			parent.classList.add('checked')
		} else {
			parent.classList.remove('checked')
		}
		
	}

}