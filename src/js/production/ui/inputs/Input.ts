

export class Input {
	dom: HTMLElement = null;
	name: string;
	constructor(dom: HTMLElement = null){

		if(!dom) return;
		this.dom = dom as HTMLInputElement;

		this.name = this.dom.getAttribute('name');

		this.create();
		this.addEventListeners();

	}

	create(){

	}

	addEventListeners(){
		
	}

	update(){
		
	}
}