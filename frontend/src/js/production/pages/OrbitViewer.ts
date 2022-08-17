import { Panels } from "../ui/Panel";
import { Search } from "../ui/Search";
import { Page } from "./Page";


export class OrbitViewer extends Page {
	load(resolve: any): void {
	
		new Search(this.dom);

		super.load(resolve)
	}

	addEventListeners(): void {

		this.addCustomizeView();

	}

	addCustomizeView(){

		const wrapper = this.dom.querySelector('.customize-view');

		const btn = wrapper.querySelector('.customize-view-icon');
		btn.addEventListener('click', () => {
			console.log('hola');

			wrapper.classList.toggle('active');
		})
	}
}