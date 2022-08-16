import { Checkbox } from "./Checkbox";



export class Inputs {
	dom: HTMLElement = null;
	constructor(dom: HTMLElement = null){

		if(!dom) return;
		this.dom = dom;

		const inputs = this.dom.querySelectorAll('input');
		for(const input of inputs){
			const type = input.getAttribute('type');

			if(type === 'checkbox') new Checkbox(input)
			
		}

	}
}