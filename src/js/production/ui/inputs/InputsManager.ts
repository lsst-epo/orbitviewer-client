import { Checkbox } from "./Checkbox";
import { DateInput } from "./DateInput";
import { DoubleRangeDistance } from "./DoubleRangeDistance";
import { DoubleRangeYear } from "./DoubleRangeYear";
import { Asteroids } from "./filters/Asteroids";
import { Centaurs } from "./filters/Centaurs";
import { Comets } from "./filters/Comets";
import { InterstellarObjects } from "./filters/InterstellarObjects";
import { NearEarthObjects } from "./filters/NearEarthObjects";
import { PlanetsMoons } from "./filters/PlantsMoons";
import { TransNeptunianObjects } from "./filters/TransNeptunianObjects";
import { Input } from "./Input";
import { Radio } from "./Radio";
import { RadioSortTours } from "./RadioSortTours";
import { ZoomRange } from "./ZoomRange";

export interface inputInterface {
	parentTemplate: string,
	name: string,
	type: string
	input: Input
}

export const inputs:Array<inputInterface> = [];

export const addInputs = () => {

			const dom = document.body;

			const _inputs = dom.querySelectorAll('.custom-input');
			for(const input of _inputs){

				if(input.classList.contains('input-initialized')) continue;
				input.classList.add('input-initialized');

				const el = input as HTMLElement;
				const type = el.getAttribute('type');

				let item = {
					parentTemplate: dom.getAttribute('data-template'),
					type,
					name: null,
					input: null
				}

				if(type === 'checkbox') {
					if(el.getAttribute('name') === 'near-earth-objects') item.input = new NearEarthObjects(el);
					if(el.getAttribute('name') === 'asteroids') item.input = new Asteroids(el);
					if(el.getAttribute('name') === 'interstellar-objects') item.input = new InterstellarObjects(el);
					if(el.getAttribute('name') === 'trans-neptunian-objects') item.input = new TransNeptunianObjects(el);
					if(el.getAttribute('name') === 'comets') item.input = new Comets(el);
					if(el.getAttribute('name') === 'planets-moons') item.input = new PlanetsMoons(el);
					if(el.getAttribute('name') === 'centaurs') item.input = new Centaurs(el);
					else item.input = new Checkbox(el)
				}
				if(type === 'radio') {
					if (el.getAttribute('name') === 'sort-radio') item.input = new RadioSortTours(el);
					else item.input = new Radio(el)
				}
				if(type === 'double-range'){
					if(el.getAttribute('name') === 'distance-range') item.input = new DoubleRangeDistance(el)
					if(el.getAttribute('name') === 'discovery-range') item.input = new DoubleRangeYear(el)
				} 
				if(type === 'range') {
					if(el.hasAttribute('data-zoom')) item.input = new ZoomRange(el)
				}
				if(el.hasAttribute('data-date')) item.input = new DateInput(el);

				item.name = item.input.name;

				if(item) inputs.push(item);

			}

}

export const updateInputs = () => {
	if(inputs.length === 0) return
	for(const input of inputs) input.input.update();
}