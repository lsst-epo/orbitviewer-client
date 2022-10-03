

export class PopupInfo {
	dom: HTMLElement;

	closeButton: HTMLElement;

	sections:NodeListOf<HTMLElement>;

	constructor(el){
		this.dom = el;

		this.sections = this.dom.querySelectorAll('section');

		this.setSize();

		this.closeButton = this.dom.querySelector('.close-item');

		this.addEventListeners();
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
			// Close all popups
		})

		for(const section of this.sections){
			section.querySelector('.head').addEventListener('click', () => {				
				for(const section of this.sections) section.classList.remove('active');
				section.classList.add('active');
			})
		}


	}

}