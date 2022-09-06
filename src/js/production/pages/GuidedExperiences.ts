import { onChange } from "../pagination/History";
import { Page } from "./Page";


export class GuidedExperiences extends Page {
	addEventListeners(): void {
		super.addEventListeners();
		
		this.dom.querySelector('[data-button="guided-experiences-button"]').addEventListener('click', () => {
			onChange('/');
		})
	}
}