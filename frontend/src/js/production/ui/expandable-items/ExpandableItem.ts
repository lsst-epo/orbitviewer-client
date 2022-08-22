import { Vector2 } from "three";

export class ExpandableItem {
	dom: HTMLElement;

	id: string;

	visible: boolean = false;
	active: boolean = false;

	position: Vector2 = new Vector2();

	constructor(dom){
		
		this.dom = dom;

		this.id = this.dom.getAttribute('data-id');

				
	}

	enable(){
		this.visible = true;
		
		this.dom.classList.add('visible');		
		
		this.addEventListeners();

	}

	disable(){
		this.visible = false;
		this.active = false;
		this.dom.classList.remove('visible');
	}

	showInfo(){
		if(this.active) return;
		if(!this.visible) return; 

		this.active = true;
		this.dom.classList.add('active');
	}

	hideInfo(){
		this.active = false;
		this.dom.classList.remove('active');
	}

	addEventListeners(){
		
		this.dom.querySelector('.close-item').addEventListener('click', () => {
			if(!this.active) this.disable();
			else this.hideInfo();
		})

		this.dom.querySelector('.item-wrapper .cover').addEventListener('click', () => {			
			this.showInfo();
		})

	}

	update(){
		if(!this.visible) return;


		this.position.x = window.innerWidth * .5;
		this.position.y = window.innerHeight * .25;
		
		this.dom.style.transform = `translate3d(${this.position.x}px, ${this.position.y}px, 0)`;
		// todo position ha de venir d'algun lloc, css3d? 
		
	}
}