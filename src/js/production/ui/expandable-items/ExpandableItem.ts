import { Vector3 } from "three";
import { Object3D } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { css2D } from "./Css2D";

export class ExpandableItem {
	dom: HTMLElement;
	container: CSS2DObject;
	ref: Object3D;

	name: string;

	visible: boolean = false;
	active: boolean = false;

	sections:NodeListOf<HTMLElement>;

	tmp: Vector3 = new Vector3();

	constructor(dom){
		
		this.dom = dom;
		this.container = new CSS2DObject(this.dom);
		css2D.add(this.container);
		
		this.name = this.dom.getAttribute('data-name');		

		this.sections = this.dom.querySelectorAll('section');

		this.onResize();
				
	}


	onResize(){

		for(const section of this.sections){
			const contents = section.querySelectorAll('.content');
			for(const content of contents) {
				content.style.height = 'auto';
				const r = content.getBoundingClientRect();
				content.style.setProperty('--height', `${r.height + 20 }px`);
				content.style.height = '';
			}
			
		}

	}

	enable(){
		this.visible = true;		

		this.dom.classList.add('visible');		

		this.ref.selected = true;
		
		this.addEventListeners();

	}

	disable(){
		this.visible = false;
		this.active = false;
		this.dom.classList.remove('visible');
		this.ref.selected = false;
		this.hideInfo();

	}

	showInfo(){
		if(this.active) return;
		if(!this.visible) return; 

		this.active = true;
		this.dom.classList.add('active');

		this.sections[0].classList.add('active');

	}

	hideInfo(){
		this.active = false;
		this.dom.classList.remove('active');
		for(const section of this.sections) section.classList.remove('active');
	}

	addEventListeners(){
		
		this.dom.querySelector('.close-item').addEventListener('click', () => {
			if(!this.active) this.disable();
			else this.hideInfo();
		})

		this.dom.querySelector('.item-wrapper .cover').addEventListener('click', () => {			
			this.showInfo();
		})

		for(const section of this.sections){
			section.querySelector('.head').addEventListener('click', () => {				
				for(const section of this.sections) section.classList.remove('active');
				section.classList.add('active');
			})
		}

	}

	update(){
		if(!this.visible) return;
		if(!!!this.ref) return;

		this.tmp.copy(this.ref.position)
		this.tmp.y -= this.ref.mesh.scale.y;

		this.container.position.copy(this.tmp);	

	}
}