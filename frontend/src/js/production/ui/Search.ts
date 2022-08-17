
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

		const input = this.dom.querySelector('.search-text-input input');

		input.addEventListener('input', () => {			
			if(input.value !== '') this.updateState(2);
		})

		const lenseButton = this.dom.querySelector('.search-lense');
		lenseButton.addEventListener('click', () => {
			this.updateState(1);
		})

		const resetButton = this.dom.querySelector('.search-reset');
		resetButton.addEventListener('click', () => {			
			input.value = ''
			this.updateState(1);
		})

		const cancelButton = this.dom.querySelector('.search-cancel');
		cancelButton.addEventListener('click', () => {			
			input.value = '';
			this.updateState(0);
		})

	}

	updateState(state: number = 0){
		this.state = state;
		this.dom.setAttribute('data-state', this.state.toString());
	}
}