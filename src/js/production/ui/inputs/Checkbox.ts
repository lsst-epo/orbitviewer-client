import { Input } from "./Input";

export class Checkbox extends Input {
	tl: GSAPTimeline;

	addEventListeners(): void {
		this.checkState(false);		

		this.dom.addEventListener('change', (e) => {
			this.checkState();
		})
	}

	reverse(){
		this.tl.reverse();		
	}

	play(){
		this.tl.play();
	}

	get checked():boolean {
		return this.dom.checked;
	}

	set checked(value:boolean) {
		this.dom.checked = value;
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
		
		if(!this.tl) return;

		if(playAnimation){
			if(checked) this.play()
			else this.reverse()
		} else {
			if(checked) this.tl.progress(1);
			else this.tl.progress(0)
		}
		
	}

}