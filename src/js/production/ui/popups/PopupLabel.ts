import { MathUtils } from "@jocabola/math";
import gsap from "gsap";
import { Vector3 } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CameraManager } from "../../../common/core/CameraManager";
import { css2D } from "./Css2D";
import { PopupInfo } from "./PopupInfo";
import { disablePopup, enablePopup } from "./PopupsManager";
import { InteractiveObject } from "./Raycaster";

export class PopupLabel {
	dom: HTMLElement;
	css2DElement: CSS2DObject;

	name: string; 

	container: HTMLElement;
	ref: InteractiveObject;

	visible: boolean = false;
	active: boolean = false;

	tmp: Vector3 = new Vector3();

	info:PopupInfo;

	constructor(dom){
		
		this.dom = dom;
		this.css2DElement = new CSS2DObject(this.dom);
		css2D.add(this.css2DElement);

		this.container = this.dom.querySelector('.item-scale-wrapper');
		
		this.name = this.dom.getAttribute('data-name');	

		this.info = new PopupInfo(document.querySelector(`.popup-info[data-name="${this.name}"]`));



	}

	loaded(){
		this.addEventListeners();
		this.show();
	}

	addEventListeners(){


		this.dom.addEventListener('click', (ev) => {							
			this.open();
		})

		document.addEventListener('keydown', (e) => {			
			if(e.key != 'Escape') return;
			this.close();
		})

	}

	onResize(){
		this.info.setSize();
	}

	hide(){
		if(!this.visible) return;

		this.visible = false;		
		this.dom.classList.remove('visible');		
	}

	show(){		
		if(this.visible) return;

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

		this.transitionInProgress = true;
		
		this.ref.selected = true;
		CameraManager.goToTarget(this.ref);

		enablePopup();

		this.animateToActive();

	}

	animateToActive(){

		const tl = gsap.timeline({
			paused: true,
			onComplete: () => {
				this.active = true;
				this.dom.classList.add('active');
			}
		})

		tl
			.addLabel('start')
			.to(this.dom, {
				x: '130px',
				y: window.innerHeight * .5,
				duration: 1,
				ease: 'power1.inOut',
				clearProps: 'all',
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

				gsap.to(this.container, {
					autoAlpha: 1,
					duration: 1,
					clearProps: 'all',
					ease: 'power1.inOut',
				})
			}
		})
		
	}

	update(){		
		if(!!!this.ref) return;

		if(!this.visible) return;
		if(this.active) return;

		this.css2DElement.position.copy(this.ref.target.position);	

		return;

		// Todo opacity relativa distancia
		const d = this.ref.target.position.distanceTo(CameraManager.cam.position);

		if(d > 80){
			this.css2DElement.element.style.opacity = '0';
			return;
		}
		this.css2DElement.element.style.opacity = '1';

	}
}
