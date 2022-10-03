
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

		const input = this.dom.querySelector('.search-text-input input') as HTMLInputElement;
		input.addEventListener('input', () => {						
			if(input.value.length > 0) this.updateState(2);
			else this.updateState(1);
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

		document.addEventListener('keydown', (e) => {			

			if(e.key != 'Escape') return;

			if(this.state === 0) return;

			input.value = '';
			this.updateState(0);
		})

	}

	updateState(state: number = 0){
		this.state = state;
		document.body.setAttribute('data-search-state', this.state.toString());
	}
}