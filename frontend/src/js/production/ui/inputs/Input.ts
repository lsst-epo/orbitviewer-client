

export class Input {
	inputElement: HTMLElement = null;
	constructor(inputElement: HTMLElement = null){

		if(!inputElement) return;
		this.inputElement = inputElement;

		this.addEventListeners();

	}

	addEventListeners(){
		
	}
}