import { Vector2 } from "three";

const wrapper = document.querySelector('.expandable-items');

export class ExpandableItem {
	dom: HTMLElement;

	id: string;

	visible: boolean = false;
	active: boolean = false;

	position: Vector2 = new Vector2();

	appended: boolean = false;
	constructor(dom){
		
		this.dom = dom.cloneNode(true);
		dom.remove();

		this.id = this.dom.getAttribute('data-id');
				
	}

	enable(){
		this.visible = true;

		if(!this.appended){
			wrapper.appendChild(this.dom);
			this.appended = true;
		}
		
		this.dom.classList.add('visible');

	}

	update(){
		if(!this.visible) return;


		this.position.x = window.innerWidth * .5;
		this.position.y = window.innerHeight * .25;

		console.log(window.innerWidth);
		
		this.dom.style.transform = `translate3d(${this.position.x}px, ${this.position.y}px, 0)`;
		// todo position ha de venir d'algun lloc, css3d? 
		
	}
}