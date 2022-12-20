import { Input } from "./Input";

export class Radio extends Input {
	dom: HTMLInputElement;
	options:NodeListOf<HTMLInputElement>;

	create(){
			const name = this.dom.getAttribute('name');
			this.options = document.querySelectorAll(`[name="${name}"]`);
	}

	addEventListeners(): void {

		this.checkState();

		this.dom.addEventListener('click', (e) => {			
			this.checkState();
			this.updateValues();
		})
	}

	checkState(){
		const parent = this.dom.parentElement;
		const el = this.dom as HTMLInputElement;		

		const checked = el.checked;				

		if(checked){
			for(const input of this.options) {
				input.parentElement.classList.remove('checked')
			}

			parent.classList.add('checked')
		} else {
			parent.classList.remove('checked')
		}
		
	}

	updateValues(){

		
	}

}