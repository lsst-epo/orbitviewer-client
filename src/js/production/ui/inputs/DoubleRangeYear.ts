import { MathUtils } from "@jocabola/math";
import { discover } from "../../../common/data/FiltersManager";
import { SolarTimeManager } from "../../../common/solar/SolarTime";
import { DoubleRange } from "./DoubleRange";

export class DoubleRangeYear extends DoubleRange {

	updateValues(){
		discover.value.min = this.value1;
		discover.value.max = this.value2;

		for(let i = 0, len = this.handles.length; i<len; i++){
			const t = this.handles[i].querySelector('.tooltip');			
			const type = i === 0 ? 'min' : 'max';
			const val = MathUtils.map(discover.value[type], 0, 1, discover.min, discover.max);
			const date = SolarTimeManager.MJD2Date(val);
			t.innerHTML = `${date.getFullYear()}`
		}
	}
}