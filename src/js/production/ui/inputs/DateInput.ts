import { formatDate, getFormatDate } from "../../utils/Dates";
import { Input } from "./Input";


export class DateInput extends Input {
	items: NodeListOf<HTMLElement>;
	input: HTMLInputElement;

	date: Date;

	create(){
		this.input = this.dom.querySelector('input[type="date"]');
		this.items = this.dom.querySelectorAll('.date-item');
		this.date = new Date();
	}

	addEventListeners(): void {

		this.input.addEventListener('input', () => {
			this.updateItems();
		})
		
	}

	updateItems(){
		this.date = new Date(this.input.valueAsDate);

		const d = getFormatDate(this.date);
		
		this.items[0].querySelector('h4').innerText = d.d;
		this.items[1].querySelector('h4').innerText = d.m;
		this.items[2].querySelector('h4').innerText = d.y;
		
	}
}