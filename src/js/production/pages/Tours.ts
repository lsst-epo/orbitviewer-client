import { onChange } from "../pagination/History";
import { Page } from "./Page";


export class Tours extends Page {
	addEventListeners(): void {
		super.addEventListeners();
		
		this.dom.querySelector('[data-button="tours-button"]').addEventListener('click', () => {
			onChange('guided-experiences');
		})
	}
}