import { uiManager } from '../uiManager';
import { uiSet } from '../uiSet';

export class MenuItem {
	id: string;
	dom: HTMLElement;
	ui: uiSet;
	protected selected: boolean = false;
	key: string = null;

	constructor(el: HTMLElement, set: uiSet) {
		this.id = el.getAttribute('id');
		this.dom = el;
		this.ui = set;

		if (this.dom.classList.contains('selected')) this.select();
		if (this.dom.hasAttribute('data-button-key')) this.key = this.dom.getAttribute('data-button-key');

		this.dom.addEventListener('click', (evt) => {
			if (!this.selected) this.select();
			else this.clear();
		});
	}

	get visible(): boolean {
		return this.selected;
	}

	select() {
		if (this.selected) return;
		this.selected = true;
		this.dom.classList.add('selected');
		uiManager.addSet(this.ui);
	}

	clear() {
		if (!this.selected) return;
		this.ui.clear();
		uiManager.removeSet(this.ui);
		this.selected = false;
		this.dom.classList.remove('selected');
	}
}
