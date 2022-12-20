import { MathUtils } from "@jocabola/math";
import { distance } from "../../../common/data/FiltersManager";
import { DoubleRange } from "./DoubleRange";

export class DoubleRangeDistance extends DoubleRange {
	updateValues(){

		distance.value.min = this.value1;
		distance.value.max = this.value2;

		for(let i = 0, len = this.handles.length; i<len; i++){
			const t = this.handles[i].querySelector('.tooltip');			
			const type = i === 0 ? 'min' : 'max';
			const val = MathUtils.map(distance.value[type], 0, 1, distance.min, distance.max);
			t.innerHTML = `${val.toFixed(2)} au`
		}

	}
}