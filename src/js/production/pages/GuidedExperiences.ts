import { onChange } from "../pagination/History";
import { Page } from "./Page";


export class GuidedExperiences extends Page {
	addEventListeners(): void {
		super.addEventListeners();

		console.log('hola');
		
		this.dom.querySelector('#guided-experiences-button').addEventListener('click', () => {
			onChange('/');
		})
	}
}