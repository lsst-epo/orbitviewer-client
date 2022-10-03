import { MathUtils } from "@jocabola/math";
import { Vector3 } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CameraManager } from "../../../common/core/CameraManager";
import { css2D } from "./Css2D";
import { popupsHide, popupsShow } from "./PopupsManager";
import { InteractiveObject } from "./Raycaster";

export class Popup {
	dom: HTMLElement;
	css2DElement: CSS2DObject;

	container: HTMLElement;
	ref: InteractiveObject;

	name: string;

	visible: boolean = false;
	active: boolean = false;

	sections:NodeListOf<HTMLElement>;

	tmp: Vector3 = new Vector3();

	constructor(dom){
		
		this.dom = dom;
		this.css2DElement = new CSS2DObject(this.dom);
		css2D.add(this.css2DElement);

		this.container = this.css2DElement.element.querySelector('.item-scale-wrapper');
		
		this.name = this.dom.getAttribute('data-name');		

		this.sections = this.dom.querySelectorAll('section');

		this.setSize();
	}

	loaded(){
		this.addEventListeners();
		this.show();
	}

	addEventListeners(){

		this.dom.querySelector('.close-item').addEventListener('click', (ev) => {			
			this.close();		
		})

		this.dom.querySelector('.item-wrapper .cover').addEventListener('click', (ev) => {							
			this.open();
		})

		document.addEventListener('keydown', (e) => {			
			if(e.key != 'Escape') return;
			this.close();
		})

		for(const section of this.sections){
			section.querySelector('.head').addEventListener('click', () => {				
				for(const section of this.sections) section.classList.remove('active');
				section.classList.add('active');
			})
		}

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

	onResize(){
		this.setSize();
	}

	hide(){
		
		if(!this.visible) return;
		console.log('hide');

		this.visible = false;		
		this.dom.classList.remove('visible');		
	}

	show(){
		console.log('show');
		
		if(this.visible) return;
		if(this.active) return;

		this.visible = true;		
		this.dom.classList.add('visible');		
	}

	close(){	

		if(!this.active) return;
		this.active = false;

		this.ref.selected = false;

		popupsHide();

		this.dom.classList.remove('active');
		for(const section of this.sections) section.classList.remove('active');

	}

	open(){

		if(this.active) return;
		if(!this.visible) return;
		
		this.active = true;

		this.dom.classList.add('active');
		
		this.ref.selected = true;
		CameraManager.goToTarget(this.ref);

		popupsShow();

		this.sections[0].classList.add('active');

	}

	update(){		
		if(!!!this.ref) return;

		if(!this.visible || this.active) {
			
			this.css2DElement.element.style.opacity = '';
			this.container.style.transform = ``;
			
			return;
		}

		this.css2DElement.position.copy(this.ref.target.position);	
		
		const d = this.ref.target.position.distanceTo(CameraManager.cam.position);
		
		if(d > 80){
			this.css2DElement.element.style.opacity = '0';
			return;
		}
		const s = MathUtils.clamp( MathUtils.map(d, 5, 150, 1, 0.1), 0.1, 1);
		this.container.style.transform = `scale3d(${s}, ${s}, 1)`;
		this.css2DElement.element.style.opacity = '1';


	}
}
