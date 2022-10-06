import { MathUtils } from "@jocabola/math";
import gsap from "gsap";
import { CategoriesMinMaxA } from "../../../common/data/Categories";
import { getClosestDateToSun, getDistanceFromEarthNow, getDistanceFromSunNow, OrbitDataElements } from "../../../common/solar/SolarUtils";
import { formatDateString } from "../../utils/Dates";
import { disablePopup } from "./PopupsManager";


export class PopupInfo {
	dom: HTMLElement;
	name: string;

	active: boolean;

	closeButton: HTMLElement;

	sections:NodeListOf<HTMLElement>;

	data: OrbitDataElements;

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
		this.applyItemPosition(distanceSun, itemA, totalMin, totalMax)

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

	// Sliders
	applyItemPosition(dom:HTMLElement, n:number, min:number, max:number){		
		const itemPosition = MathUtils.map(n, min, max, 0, 100);
		dom.style.setProperty('--item-position', `${itemPosition}%`);
	}

	addData(){

		if(!this.data) return;

		const names = this.dom.querySelectorAll('[data="name"]') as NodeListOf<HTMLElement>;
		for(const name of names) name.innerText = this.data.fulldesignation;

		const a = this.dom.querySelector('[data="a"]') as HTMLElement;
		a.innerText = this.data.a.toFixed(2);
		const slideA = this.dom.querySelector('[data-slider="a"]') as HTMLElement;
		this.applyItemPosition(slideA, this.data.a, 0, 100);

		const e = this.dom.querySelector('[data="e"]') as HTMLElement;
		e.innerText = this.data.e.toFixed(2);
		const slideE = this.dom.querySelector('[data-slider="e"]') as HTMLElement;
		this.applyItemPosition(slideE, this.data.e, 0, 1);

		const i = this.dom.querySelector('[data="incl"]') as HTMLElement;
		i.innerText = this.data.incl.toFixed(2);
		const slideI = this.dom.querySelector('[data-slider="incl"]') as HTMLElement;
		this.applyItemPosition(slideI, this.data.incl, 0, 180);

		const peri = this.dom.querySelector('[data="peri"]') as HTMLElement;
		peri.innerText = this.data.peri.toFixed(2);

		const node = this.dom.querySelector('[data="node"]') as HTMLElement;
		node.innerText = this.data.node.toFixed(2);

		const m = this.dom.querySelector('[data="m"]') as HTMLElement;
		m.innerText = this.data.M.toFixed(2);

		const b = this.dom.querySelector('[data="brightness"]') as HTMLElement;
		b.innerText = this.data.mpch.toFixed(2);

		// Fill data
		const date = getClosestDateToSun(this.data);		
		const dClosest = this.dom.querySelector('[data="date"]') as HTMLElement;
		dClosest.innerText = formatDateString(date);

		// Distance sun
		const dSun = this.dom.querySelector('[data="far-sun"]') as HTMLElement;
		const dEarth = this.dom.querySelector('[data="far-earth"]') as HTMLElement;
		dSun.innerText = `${getDistanceFromSunNow(this.data).toFixed(2)} au`;
		dEarth.innerText = `${getDistanceFromEarthNow(this.data).toFixed(2)} au`;
				
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

	show(closeUp:boolean = true){
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

		const delay = closeUp ? 4 : 2;	
		const tl = gsap.timeline({ paused: true, delay })

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
				stagger: 0.1,
				duration: 0.5,
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