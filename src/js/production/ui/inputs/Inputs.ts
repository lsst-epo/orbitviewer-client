import { Checkbox } from "./Checkbox";
import { DoubleRange } from "./DoubleRange";
import { Radio } from "./Radio";



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
			if(type === 'radio') new Radio(el)
			if(type === 'double-range') new DoubleRange(el)
			
		}

	}
}