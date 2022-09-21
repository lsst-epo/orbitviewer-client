import { Input } from "./Input";

export class Checkbox extends Input {
	tlIn: GSAPTimeline;
	tlOut: GSAPTimeline;

	addEventListeners(): void {
		this.checkState(false);		

		this.dom.addEventListener('change', (e) => {
			this.checkState();
		})
	}

	checkState(playAnimation:boolean = true){

		const parent = this.dom.parentElement;
		const el = this.dom as HTMLInputElement;

		const checked = el.checked;

		if(checked){
			parent.classList.add('checked')
		} else {
			parent.classList.remove('checked')
		}
		
		if(!this.tlIn && !this.tlOut) return;

		if(playAnimation){
			if(checked) this.tlIn.play(0);
			else this.tlOut.play(0)
			
		} else {
			if(checked) this.tlIn.progress(1);
			else this.tlOut.progress(1);
		}
		
	}

}