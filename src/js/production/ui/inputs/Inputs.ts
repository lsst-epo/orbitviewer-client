import { Checkbox } from "./Checkbox";
import { DateInput } from "./DateInput";
import { DoubleRange } from "./DoubleRange";
import { Asteroids } from "./filters/Asteroids";
import { InterstellarObjects } from "./filters/InterstellarObjects";
import { NearEarthObjects } from "./filters/NearEarthObjects";
import { Input } from "./Input";
import { Radio } from "./Radio";
import { TimePickerRange } from "./TimePickerRange";
import { ZoomRange } from "./ZoomRange";



export class Inputs {
	dom: HTMLElement = null;
	inputs:Array<Input> = [];
	constructor(dom: HTMLElement = null){

		if(!dom) return;
		this.dom = dom;

		const inputs = this.dom.querySelectorAll('.custom-input');
		for(const input of inputs){
			
			const el = input as HTMLElement;
			const type = el.getAttribute('type');

			let item = null;

			if(type === 'checkbox') {
				if(el.getAttribute('name') === 'near-earth-objects') item = new NearEarthObjects(el);
				if(el.getAttribute('name') === 'asteroids') item = new Asteroids(el);
				if(el.getAttribute('name') === 'interstellar-objects') item = new InterstellarObjects(el);
				else item = new Checkbox(el)
			}
			if(type === 'radio') item = new Radio(el)
			if(type === 'double-range') item = new DoubleRange(el)
			if(type === 'range') {
				if(el.hasAttribute('data-zoom')) item = new ZoomRange(el)
				if(el.hasAttribute('data-timer')) item = new TimePickerRange(el)
			}
			if(el.hasAttribute('data-date')) item = new DateInput(el);
			
			if(item) this.inputs.push(item);
			
		}

	}

	update(){		
		if(this.inputs.length === 0) return
		for(const input of this.inputs) input.update();
	}
}