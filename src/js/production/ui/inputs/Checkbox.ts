import { Input } from "./Input";

export class Checkbox extends Input {

	addEventListeners(): void {

		this.checkState();

		this.dom.addEventListener('change', (e) => {
			this.checkState();
		})
	}

	checkState(){
		const parent = this.dom.parentElement;
		const el = this.dom as HTMLInputElement;

		const checked = el.checked;

		if(checked){
			parent.classList.add('checked')
		} else {
			parent.classList.remove('checked')
		}
		
	}

}