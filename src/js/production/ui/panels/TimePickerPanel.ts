import { MathUtils } from "@jocabola/math";
import { isMobile } from "@jocabola/utils";
import gsap from "gsap/all";
import { solarClock } from "../../../common/core/CoreApp";
import { formatDate } from "../../utils/Dates";
import { Panel } from "./Panel";

enum STATE {
	HIDDEN,
	ACTIVE,
	EDIT
}

export class TimePickerPanel extends Panel {
	orbitButton: HTMLButtonElement;
	thumb: HTMLButtonElement;
	subPanel: HTMLElement;

	date: Date; 
	domDate: HTMLElement;

	reset: HTMLButtonElement;
	edit: HTMLButtonElement;

	state: STATE = 0;

	range: HTMLInputElement;
	value: number = 0;
	holding: boolean = false;

	subPanelApply: HTMLButtonElement;
	subPanelCancel: HTMLButtonElement;
	subPanelInput: HTMLInputElement;

	tl: GSAPTimeline;
	tlPlayed: boolean = false;

	tlClock: GSAPTimeline;
	
	constructor(id){
		super(id);
		this.updateTimer();
	}

	create(): void {

		// Date 
		this.date = new Date();
		this.domDate = this.dom.querySelector('.time-picker-details p span');

		// DOM
		this.orbitButton = document.querySelector(`.time-picker`);
		this.thumb = this.dom.querySelector('.time-picker-icon');
		this.range = this.dom.querySelector('.time-picker-input input');
		this.subPanel = this.dom.querySelector('.sub-panel');

		// Sub Panel Stuff
		const buttonsZone = this.dom.querySelector('.time-picker-details');

		this.reset = buttonsZone.querySelector('[data-timer="reset"]');
		this.edit = buttonsZone.querySelector('[data-timer="edit"]');

		this.subPanelApply = this.subPanel.querySelector('[data-button="apply-date"]');
		this.subPanelCancel = this.subPanel.querySelector('[data-button="close-edit"]');
		this.subPanelInput = this.subPanel.querySelector('input[type="date"]');

		this.createTl();
		this.createClockTl();
	}

	createTl(){
		this.tl = gsap.timeline({
			paused: true
		});

		this.tl.timeScale(1.2);

		const wrapper = this.dom.querySelector('.time-picker-input svg');
	
		// Set all paths to alpha 0
		const paths = wrapper.querySelectorAll('path');
		for(const path of paths) {
			gsap.set(path, { autoAlpha: 0 })
		}

		// Range tween
		gsap.set(this.range, { scaleX: 0, transformOrigin: 'center' });
		this.tl.add(gsap.to(this.range, { scaleX: 1, duration: 3, ease: 'expo.out' }), 0);

		// Create chevron tweens
		const past = wrapper.querySelectorAll('[class^="past"]');
		const future = wrapper.querySelectorAll('[class^="future"]');

		for(let i = 0; i<=2; i++){

			const ii = i + 1;

			const distance = isMobile() ? 40 : 60;
			const defaultOffset = 7;

			const pastTween = gsap.to(past[i].querySelectorAll('path'), {
				x: (index, element) => {
					const offset = defaultOffset * index;
					return (distance * ii) + offset
				},
				autoAlpha: 1,
				ease: 'expo.out',
				duration: 1.5,
				stagger: 0.2
			})
			const futureTween = gsap.to(future[i].querySelectorAll('path'), {
				x: (index, element) => {
					const offset = defaultOffset * index;
					return -(distance * ii) - offset
				},
				autoAlpha: 1,
				ease: 'expo.out',
				duration: 1.5,
				stagger: 0.2
			})

			this.tl.add(pastTween, 0.5 * ii)
			this.tl.add(futureTween, 0.5 * ii)

		}
		

		
	}

	createClockTl(){

		const busques = this.dom.querySelectorAll('.time-picker-icon-wrapper svg g path');
		this.tlClock = gsap.timeline({ paused: true });

		gsap.set(busques[0], { transformOrigin: '50% 100%', rotate: -800 });
		gsap.set(busques[1], { transformOrigin: '20% 20%', rotate: -200 });

		this.tlClock
			.to(busques[0],{ rotate: 800, ease: 'linear' }, 0)
			.to(busques[1],{ rotate: 200, ease: 'linear' }, 0)
	

	}

	animationPlay(){
		if(this.tlPlayed) return;
		this.tlPlayed = true;

		this.tl.pause();
		this.tl.progress(0);

		this.tl.play();

	}

	animationReset(){
		if(!this.tlPlayed) return;
		this.tlPlayed = false;

	}

	dateInputReset(){

		setTimeout(() => {
			const items = this.subPanel.querySelectorAll('.date-item h4');
			items[0].innerText = 'DD';
			items[1].innerText = 'MM';
			items[2].innerText = 'YY';
		}, 500);


	}

	updateTimer(){

		if(!!!this.subPanelInput.valueAsDate) {
			return;
		}

		const date = new Date(this.subPanelInput.valueAsDate);
		solarClock.setDate(date);

		this.state = 1;
		this.togglePanel();		
	}

	togglePanel(): void {

		this.active = this.state > 0;
		if(this.active) this.dom.classList.add('active');
		else this.dom.classList.remove('active');

		if(this.state === 2) this.subPanel.classList.add('active');
		else this.subPanel.classList.remove('active');

		if(this.state > 0) this.orbitButton.classList.add('hidden');
		else this.orbitButton.classList.remove('hidden');

		if(this.state === 1) this.animationPlay();
		if(this.state === 0) this.animationReset();
		if(this.state !== 2) this.dateInputReset();
		
	}

	addEventListeners(){

		const buttons = document.querySelectorAll(`[data-panel-button="${this.id}"]`);
		if(buttons.length === 0) return;

		for(const button of buttons){
			button.addEventListener('click', () => { 		
				if(this.active) this.state = 0;
				else this.state = 1;

				this.togglePanel();
			})
		}

		this.reset.addEventListener('click', () => {	
			solarClock.setDate();
			this.range.value = '0';
		})

		this.edit.addEventListener('click', () => {
			this.state = 2;
			this.togglePanel();
		})

		this.subPanelApply.addEventListener('click', () => {
			this.updateTimer();
		})

		this.subPanelCancel.addEventListener('click', () => {
			this.state = 1;
			this.togglePanel();
		})

	}

	update(){

		if(!this.active) {
			if(this.value === 0 && this.range.valueAsNumber === 0) return;
		}

		this.value = parseFloat(this.range.value);
		
		if(!this.holding){
			this.value = MathUtils.lerp(this.value, 0, 0.1);
			// this.range.value = this.value.toString();
		}
		
		this.thumb.style.transform = `translateX(${50 * this.value}%)`;

		// Update date
		const date = formatDate(solarClock.currentDate);
		this.domDate.innerText = date;		

		// Update clock animation
		this.tlClock.progress(MathUtils.map(this.value, -1, 1, 0, 1))
				
	}
}