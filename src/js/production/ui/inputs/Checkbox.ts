import { Input } from "./Input";

export class Checkbox extends Input {
	tl: GSAPTimeline;

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

			console.log('click', this.tl);
			

			if(this.tl) this.tl.play(0);
		} else {
			parent.classList.remove('checked')
		}
		
	}

}