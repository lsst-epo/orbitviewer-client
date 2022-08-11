import { onChange } from "../pagination/History";
import { Page } from "./Page";


export class Landing extends Page {
	addEventListeners(): void {
		
		const btn1 = this.dom.querySelector('#landing-button-left');
		const btn2 = this.dom.querySelector('#landing-button-right');

		btn1.addEventListener('click', (e) => {
			e.preventDefault();
			onChange('customize');
		})
		btn2.addEventListener('click', (e) => {
			e.preventDefault();
			onChange('guided-experiences');
		})
	}
}