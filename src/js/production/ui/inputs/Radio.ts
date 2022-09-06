import { Input } from "./Input";

export class Radio extends Input {

	addEventListeners(): void {

		this.checkState();

		this.dom.addEventListener('click', (e) => {			
			this.checkState();
		})
	}

	checkState(){
		const parent = this.dom.parentElement;
		const el = this.dom as HTMLInputElement;

		const checked = el.checked;		

		if(checked){

			const name = this.dom.getAttribute('name');
			const inputs = document.querySelectorAll(`[name="${name}"]`);
			for(const input of inputs) {
				input.parentElement.classList.remove('checked')
			}

			parent.classList.add('checked')
		} else {
			parent.classList.remove('checked')
		}
		
	}

}