

export class Input {
	inputElement: HTMLElement = null;
	constructor(inputElement: HTMLElement = null){

		if(!inputElement) return;
		this.inputElement = inputElement;

		this.create();
		this.addEventListeners();

	}

	create(){
		
	}

	addEventListeners(){
		
	}
}