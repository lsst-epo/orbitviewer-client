import { Search } from "../partials/Search";
import { enableExpandableItem } from "../ui/expandable-items/ExpandableItems";
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
			wrapper.classList.toggle('active');
		})

		document.addEventListener('keydown', (e) => {			

			if(e.key != 'Escape') return;

			if(!wrapper.classList.contains('active')) return;

			e.preventDefault();

			wrapper.classList.remove('active');
		})
	}
}