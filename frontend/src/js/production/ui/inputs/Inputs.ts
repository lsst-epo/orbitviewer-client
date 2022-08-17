import { Checkbox } from "./Checkbox";
import { DoubleRange } from "./DoubleRange";



export class Inputs {
	dom: HTMLElement = null;
	constructor(dom: HTMLElement = null){

		if(!dom) return;
		this.dom = dom;

		const inputs = this.dom.querySelectorAll('.custom-input');
		for(const input of inputs){
			const el = input as HTMLElement;
			const type = el.getAttribute('type');

			if(type === 'checkbox') new Checkbox(el)
			if(type === 'double-range') new DoubleRange(el)
			
		}

	}
}