import { DEV } from "../../../common/core/Globals";
import { getLanguage } from "../../pagination/PagesRecap";
import { Panel } from "./Panel";


export class LanguagePanel extends Panel {
	currentLanguage: string;

	inputs: NodeListOf<HTMLInputElement>;

	create(){
		this.inputs = this.dom.querySelectorAll('input[type="radio"]');
		this.currentLanguage = getLanguage();
	}

	getActiveInputLanguage() {
		for(const input of this.inputs){
			if(input.checked) return input.value;
		}
	}

	changeLanguage(to: string = 'en'){
		let url = window.location.href;

		if(to === 'en'){
			url = url.replace('/es/', '/en/');
		} else {
			url = url.replace('/en/', '/es/');
		}

		window.location.href = url;
			
	}

	addEventListeners(): void {
		super.addEventListeners();

		const apply = this.dom.querySelector('[data-button="language-apply"]');
		const reset = this.dom.querySelector('[data-button="language-reset"]');
		
		apply.addEventListener('click', () => {
			const val = this.getActiveInputLanguage();
			if(val === this.currentLanguage){
				if(DEV) ('Same language');
				return;
			}
			this.changeLanguage(val)
		})
		reset.addEventListener('click', () => {
			if(this.currentLanguage === 'en'){
				if(DEV) console.log('EN is default language');
				return;
			}
			this.changeLanguage();
		})
	}
}