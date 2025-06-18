import { MathUtils } from "@jocabola/math";
import { Input } from "./Input";


export class DoubleRange extends Input {
	value1: number = 0;
	value2: number = 0;

	handles: NodeListOf<HTMLElement>;
	range: HTMLElement;
	addEventListeners(): void {

		const first = this.dom.querySelector('input[name="first"]') as HTMLInputElement;
		const second = this.dom.querySelector('input[name="second"]') as HTMLInputElement;

		this.value1 = first.valueAsNumber;
		this.value2 = second.valueAsNumber;		

		this.handles = this.dom.querySelectorAll('.handle .handle-grab');

		for(const el of this.handles){
			this.handleListeners(el)
		}		
	}

	handleListeners(el){
		const active = el.parentElement.classList.contains('handle-1') ? 1 : 2;

		let dragging = false;
		let x = 0;
		let w = 0;
		let originalValue = 0;

		const dom = active === 1 ? this.dom.querySelector('input[name="first"]') as HTMLInputElement : this.dom.querySelector('input[name="second"]') as HTMLInputElement;

		const mouseDown = (clientX) => {
			dragging = true;
			x = clientX;

			const first = this.dom.querySelector('input[name="first"]') as HTMLInputElement;
			const second = this.dom.querySelector('input[name="second"]') as HTMLInputElement;

			this.value1 = first.valueAsNumber;
			this.value2 = second.valueAsNumber;		

			const range = this.dom.getBoundingClientRect();
			w = range.width;

			originalValue = MathUtils.map(active === 1 ? this.value1 : this.value2, 0, 1, 0, w);

			window.addEventListener('mouseup', () => {
				dragging = false;
				x = 0;
				this.updateValues();
				el.classList.remove('tooltip-active');
			}, { once: true })
			window.addEventListener('touchend', () => {
				dragging = false;
				x = 0;
				this.updateValues();
				el.classList.remove('tooltip-active');
			}, { once: true })
		}

		el.addEventListener('mousedown', (e) => {
			el.classList.add('tooltip-active');
			mouseDown(e.clientX);
		})
		el.addEventListener('touchstart', (e) => {
			el.classList.add('tooltip-active');
			mouseDown(e.touches[0].clientX);
		})

		const mouseMove = (clientX) => {
			if(!dragging) return;

			const movementDistance = originalValue + (clientX - x);

			// offset to prevent handle overlap
			const offset = 0.075;
			const min = active === 1 ? 0 : this.value1 + offset;
			const max = active === 1 ? this.value2 - offset : 1;

			const newValue = MathUtils.clamp(MathUtils.map(movementDistance, 0, w, 0, 1), min, max);
			dom.valueAsNumber = newValue;
			this.dom.style.setProperty(`--range-${active}`, newValue.toString());
			if(active === 1) this.value1 = newValue;
			else this.value2 = newValue;
			dom.value = `${newValue}`;

			this.updateValues();
		}

		window.addEventListener('mousemove', (e) => {
			mouseMove(e.clientX);
		})

		window.addEventListener('touchmove', (e) => {
			mouseMove(e.touches[0].clientX);
		})
	}


	updateValues(){
		
	}
}