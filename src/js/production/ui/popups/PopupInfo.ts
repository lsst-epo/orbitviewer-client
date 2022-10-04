import { disablePopup } from "./PopupsManager";


export class PopupInfo {
	dom: HTMLElement;
	name: string;

	active: boolean;

	closeButton: HTMLElement;

	sections:NodeListOf<HTMLElement>;

	constructor(el){
		this.dom = el;

		this.name = this.dom.getAttribute('data-name');

		this.sections = this.dom.querySelectorAll('section');

		this.closeButton = this.dom.querySelector('.close-item');

	}

	onResize(){
		this.setSize();
	}

	loaded(){
		this.addEventListeners();
		this.setSize();
	}

	setSize(){

		for(const section of this.sections){
			const contents = section.querySelectorAll('.content') as NodeListOf<HTMLElement>;
			for(const content of contents) {
				content.style.height = 'auto';
				const r = content.getBoundingClientRect();
				content.style.setProperty('--height', `${r.height + 20 }px`);
				content.style.height = '';
			}
		}
	}

	addEventListeners(){

		this.dom.querySelector('.close-item').addEventListener('click', (ev) => {			
			console.log('clicj¡k', this.name, this.active);
			
			if(!this.active) return;
			ev.stopPropagation();
			ev.preventDefault();
			disablePopup();
		})

		document.addEventListener('keydown', (e) => {			
			if(e.key != 'Escape') return;
			if(!this.active) return;
			disablePopup();
		})

		for(const section of this.sections){
			section.querySelector('.head').addEventListener('click', () => {				
				for(const section of this.sections) section.classList.remove('active');
				section.classList.add('active');
			})
		}


	}

	show(){
		if(this.active) return;
		this.active = true;
		this.sections[0].classList.add('active');
		this.dom.classList.add('active');
	}

	hide(){
		if(!this.active) return;
		
		this.active = false;
		this.dom.classList.remove('active');
		for(const section of this.sections) section.classList.remove('active');
	}

}