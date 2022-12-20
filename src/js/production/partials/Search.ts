import { el } from "@jocabola/utils";
import { capitalize } from "../../utils/strings";
import { broadcastPanelsClose } from "../ui/panels/PanelsManager";
import { enablePopup, PopupInterface, popups } from "../ui/popups/PopupsManager";

enum STATE {
	IDLE,
	ACTIVE,
	FOCUS
}

export class Search {
	dom: HTMLElement;
	state: STATE = 0;

	input:HTMLInputElement;
	random:HTMLButtonElement;

	items:Array<string> = [];
	results:HTMLElement;
	constructor(dom: HTMLElement = null){

		if(!!!dom) return;

		this.dom = dom.querySelector('.search');
		this.input = this.dom.querySelector('.search-text-input input') as HTMLInputElement;

		this.random = document.querySelector('[data-button="random-search"]');

		this.results = this.dom.querySelector('.search-results');
		

		this.addEventListeners();

	}

	addEventListeners(){

		this.input.addEventListener('input', () => {						
			if(this.input.value.length > 0) this.updateState(2);
			else this.updateState(1);
			this.updateSearch();
		})

		const lenseButton = this.dom.querySelector('.search-lense');
		lenseButton.addEventListener('click', () => {
			broadcastPanelsClose();
			this.updateState(1);
			this.updateSearch();
		})

		const resetButton = this.dom.querySelector('.search-reset');
		resetButton.addEventListener('click', () => {			
			this.input.value = ''
			this.updateState(1);
			this.updateSearch();
		})

		const cancelButton = this.dom.querySelector('.search-cancel');
		cancelButton.addEventListener('click', () => {			
			this.input.value = '';
			this.updateState(0);
			this.updateSearch();
		})

		document.addEventListener('keydown', (e) => {			

			if(e.key != 'Escape') return;

			if(this.state === 0) return;

			this.input.value = '';
			this.updateState(0);
			this.updateSearch();
		})

		this.random.addEventListener('click', () => {

			const randomItem = popups[Math.floor(Math.random()*popups.length)];
			enablePopup(randomItem.name);

			this.input.value = '';
			this.updateState(0);
			this.updateSearch();
		})

	}

	updateState(state: number = 0){
		this.state = state;
		document.body.setAttribute('data-search-state', this.state.toString());
	}

	resultClick(item){

		enablePopup(item);
		this.input.value = '';
		this.updateState(0);
		this.updateSearch();

	}

	createItem(p:PopupInterface){
		if(this.items.find(x => x === p.name)) return
		this.items.push(p.name);

		const item = el('div', 'result-item');
		item.classList.add('ui__button', 'ghost-button');
		item.setAttribute('data-name', p.name);
		item.innerText = capitalize(p.name);
		this.results.prepend(item);

		item.addEventListener('click', () => {
			this.resultClick(p.name);
		})

		this.results.classList.add('has-results');

	}

	destroyItem(item:string){
		this.items = this.items.filter(x => x !== item);		

		const d = this.results.querySelector(`[data-name="${item}"]`);
		d.removeEventListener('click', () => {
			this.resultClick(item);
		})
		d.remove();

		if(this.items.length === 0) this.results.classList.remove('has-results');
	}

	updateSearch(){

		const v = this.input.value.toLowerCase();

		if(v === ''){
			for(const item of this.items) this.destroyItem(item);
			return;
		}

		const activePopups = popups.filter(x => x.name.toLowerCase().includes(v) );		

		for(const p of activePopups){
			this.createItem(p);
		}

		for(const item of this.items){
			if(activePopups.find(x => x.name === item)) continue;
			this.destroyItem(item);
		}
		
	}
}