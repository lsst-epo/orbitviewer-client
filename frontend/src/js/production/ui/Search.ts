
enum STATE {
	IDLE,
	ACTIVE,
	FOCUS
}

export class Search {
	dom: HTMLElement;
	state: STATE = 0;
	constructor(dom: HTMLElement = null){

		if(!!!dom) return;

		this.dom = dom.querySelector('.search');

		this.addEventListeners();

	}

	addEventListeners(){

		const input = this.dom.querySelector('.search-text-input');

		const lenseButton = this.dom.querySelector('.search-lense');
		lenseButton.addEventListener('click', () => {
			if(this.state === 0){
				this.state = 1;
			}
			this.dom.setAttribute('data-state', this.state.toString());
		})

		const closeButton = this.dom.querySelector('.search-reset');
		closeButton.addEventListener('click', () => {
			input.value = ''
		})

	}
}