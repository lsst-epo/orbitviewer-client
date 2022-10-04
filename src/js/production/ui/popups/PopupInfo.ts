import { MathUtils } from "@jocabola/math";
import gsap from "gsap";
import { CategoriesMinMaxA } from "../../../common/data/Categories";
import { OrbitElements } from "../../../common/solar/SolarSystem";
import { disablePopup } from "./PopupsManager";


export class PopupInfo {
	dom: HTMLElement;
	name: string;

	active: boolean;

	closeButton: HTMLElement;

	sections:NodeListOf<HTMLElement>;

	data: OrbitElements;

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
		this.addData();
		this.setSize();

	}

	addAData(){

		const distanceSun = this.dom.querySelector('[data="sun-distance"]') as HTMLElement;
		const category = this.dom.getAttribute('data-category');

		if(!category) return

		// Todo ara es fake perque sino no queda be
		const totalMin = 0; // CategoriesMinMaxA.total.min;
		const totalMax = 50; // CategoriesMinMaxA.total.max;

		const aMin = CategoriesMinMaxA[category].min;
		const aMax = CategoriesMinMaxA[category].max;
 
		// Set marker position
		const itemA = this.data.a;				
		const itemPosition = MathUtils.map(itemA, totalMin, totalMax, 0, 100);
		distanceSun.style.setProperty('--item-position', `${itemPosition}%`);

		// Set range size
		const diff = aMax - aMin;
		const rangeSize = MathUtils.map(diff, totalMin, totalMax, 0, 100);
		distanceSun.style.setProperty('--item-range', `${rangeSize}%`);

		// Set range size
		const rightSide = MathUtils.map(aMin, totalMin, totalMax, 0, 100);
		const leftSide = MathUtils.map(aMax, totalMin, totalMax, 0, 100);
		const center = (leftSide + rightSide) / 2;
		distanceSun.style.setProperty('--item-range-position', `${center}%`);
		


		distanceSun.classList.remove('slide-loading');
		
	}

	addData(){

		if(!this.data) return;

		const names = this.dom.querySelectorAll('[data="name"]') as NodeListOf<HTMLElement>;
		for(const name of names) name.innerText = this.data.fulldesignation;
		
		this.addAData();


	}

	setSize(){

		for(const section of this.sections){
			const contents = section.querySelectorAll('.content') as NodeListOf<HTMLElement>;
			for(const content of contents) {
				content.style.height = 'auto';
				const r = content.getBoundingClientRect();
				content.style.setProperty('--height', `${r.height}px`);
				content.style.height = '';
			}
		}
	}

	addEventListeners(){

		this.dom.querySelector('.close-item').addEventListener('click', (ev) => {						
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
				if(section.classList.contains('active')) {
					section.classList.remove('active');			
					return;
				}
				for(const section of this.sections) section.classList.remove('active');
				section.classList.add('active');
			})
		}


	}

	show(){
		if(this.active) return;
		this.active = true;

		const sectionRect = this.sections[0].getBoundingClientRect();

		gsap.set(this.sections, {
			height: 0,
			transformOrigin: '50% 0%'
		})
		gsap.set(this.closeButton, {
			scale: 0,
			transformOrigin: '50% 50%'
		})

		const cover = this.dom.querySelector('.cover');
		const coverRect = cover.getBoundingClientRect();

		gsap.set(cover, {
			height: 0,
		})

		this.dom.classList.add('active');

		const tl = gsap.timeline({ paused: true, delay: 4 })

		tl
			.addLabel('start')
			.to(this.closeButton, {
				scale: 1,
				duration: 1,
				ease: 'power2.inOut',
				clearProps: 'all',
			}, 'start')
			.to(this.dom.querySelector('.cover'), {
				height: coverRect.height,
				duration: 1,
				ease: 'power2.inOut',
				clearProps: 'height',
			}, 'start')
			.to(this.sections, {
				height: sectionRect.height,
				stagger: 1.2,
				duration: 1,
				ease: 'power2.inOut',
				clearProps: 'all',
				onComplete: () => {

					// Prevents user spamclicking 
					let active = false;
					for(const section of this.sections){
						if(section.classList.contains('active')) active = true;
					}
					if(!active)	this.sections[0].classList.add('active');
				}
			})

			tl.play();
	}

	hide(){
		if(!this.active) return;
		
		this.active = false;
		this.dom.classList.remove('active');
		for(const section of this.sections) section.classList.remove('active');
	}

}