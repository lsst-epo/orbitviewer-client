import { Input } from "./Input";

export class Checkbox extends Input {
	tl: GSAPTimeline;

	addEventListeners(): void {
		this.checkState(false);		

		this.dom.addEventListener('change', (e) => {
			this.checkState();
		})
	}

	checkState(playAnimation:boolean = true){

		if(!playAnimation && this.tl) this.tl.progress(1);

		const parent = this.dom.parentElement;
		const el = this.dom as HTMLInputElement;

		const checked = el.checked;

		if(checked){
			parent.classList.add('checked')
			
			if(this.tl && playAnimation) this.tl.play(0);
		} else {
			parent.classList.remove('checked')
		}
		
	}

}