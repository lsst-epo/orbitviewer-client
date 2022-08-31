import { onChange } from "../pagination/History";
import { Page } from "./Page";


export class Tours extends Page {
	addEventListeners(): void {
		super.addEventListeners();

		console.log('hola');
		
		this.dom.querySelector('#tours-button').addEventListener('click', () => {
			onChange('guided-experiences');
		})
	}
}