import { MathUtils } from "@jocabola/math";
import gsap from "gsap";
import { Vector3 } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CameraManager } from "../../../common/core/CameraManager";
import { css2D } from "./Css2D";
import { disablePopup, enablePopup } from "./PopupsManager";
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

		this.container = this.dom.querySelector('.item-scale-wrapper');
		
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

		this.ref.selected = false;

		disablePopup();

		this.animateToNotActive();

	}

	open(){

		if(this.active) return;
		if(!this.visible) return;
		
		this.ref.selected = true;
		CameraManager.goToTarget(this.ref);

		enablePopup();

		this.animateToActive();

	}

	animateToActive(){

		this.dom.classList.add('transition-in-progress');

		const tl = gsap.timeline({
			paused: true,
			onComplete: () => {
				this.dom.classList.remove('transition-in-progress'); 
				this.active = true;
				this.dom.classList.add('active');
				this.sections[0].classList.add('active');
			}
		})

		tl
			.addLabel('start')
			.to(this.dom, {
				x: '130px',
				y: window.innerHeight * .5,
				duration: 1.5,
				ease: 'power1.inOut'
			})

		tl.play();

	}
	animateToNotActive(){

		gsap.to(this.container, {
			autoAlpha: 0,
			duration: 0.6,
			ease: 'power1.inOut',
			onComplete: () => {

				this.active = false;
				this.dom.classList.remove('active');
				for(const section of this.sections) section.classList.remove('active');

				gsap.to(this.container, {
					autoAlpha: 1,
					duration: 1,
					ease: 'power1.inOut'
				})
			}
		})
		
	}

	update(){		
		if(!!!this.ref) return;

		if(!this.visible) return;
		if(this.active) return;

		this.css2DElement.position.copy(this.ref.target.position);	

		const d = this.ref.target.position.distanceTo(CameraManager.cam.position);

		if(d > 80){
			this.css2DElement.element.style.opacity = '0';
			return;
		}
		// const s = MathUtils.clamp( MathUtils.map(d, 5, 150, 1, 0.1), 0.1, 1);
		// this.container.style.transform = `scale3d(${s}, ${s}, 1)`;
		this.css2DElement.element.style.opacity = '1';

	}
}
