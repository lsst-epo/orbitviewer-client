import { MathUtils } from "@jocabola/math";
import { isMobile, isTouchDevice } from "@jocabola/utils";
import { lchown } from "fs-extra";
import gsap from "gsap";
import { CoreAppSingleton, solarClock } from "../../../common/core/CoreApp";
import { CLOCK_SETTINGS } from "../../../common/core/Globals";
import { formatDate } from "../../utils/Dates";
import { Panel } from "./Panel";
import { panels } from "./PanelsManager";
import { TimePickerSubPanel } from "./TimePickerSubPanel";

export enum STATE {
	HIDDEN,
	HIDDEN_EDITED,
	ACTIVE,
	EDIT,
}


export class TimePickerPanel extends Panel {
	timer: HTMLElement;
	icon: HTMLElement;
	fakeRange: HTMLElement;

	state: STATE = 0;

	resetButton: HTMLButtonElement;
	editButton: HTMLButtonElement;
	pauseButton: HTMLButtonElement;

	subPanel: TimePickerSubPanel;

	range: HTMLInputElement;
	value: number = 0;
	animationValue: number = 0;
	holding: boolean = false;

	date: Date; 
	domDate: HTMLElement;

	arrowsTl: GSAPTimeline;

	dragging: boolean = false;
	draggingOriginalX: number = 0;
	draggingOriginalValue: number = 0;
	draggingRangeW: number = 0;

	clockTicks: NodeListOf<HTMLElement>;

	create(){
		this.timer = document.querySelector('.timer');
		this.icon = this.timer.querySelector('.timer-icon');
		this.fakeRange = this.timer.querySelector('.fake-range');

		const buttonsZone = this.dom.querySelector('.time-picker-details');
		this.resetButton = buttonsZone.querySelector('[data-timer="reset"]');
		this.editButton = buttonsZone.querySelector('[data-timer="edit"]');
		this.pauseButton = buttonsZone.querySelector('[data-timer="pause"]');

		this.subPanel = panels.find(x => x.id === 'time-picker-subpanel') as TimePickerSubPanel;
		
		this.range = this.timer.querySelector('input');
		this.value = this.range.valueAsNumber;

		this.date = new Date();
		this.domDate = this.dom.querySelector('.time-picker-details p span');

		this.arrowsTl = createArrowsTl();

		this.clockTicks = this.icon.querySelectorAll('.ticks path');
		this.initClock();
	}

	leave(){
		this.reset();
		this.state = STATE.HIDDEN;
		this.changeState();
	}

	onMousedown(x) {
		this.dragging = true;

		const r = this.fakeRange.getBoundingClientRect();
		this.draggingRangeW = r.width;

		this.draggingOriginalX = x;

		this.draggingOriginalValue = MathUtils.map(this.value, -1, 1, 0, this.draggingRangeW);

		window.addEventListener('mouseup', () => {
			this.dragging = false;
			this.draggingOriginalX = 0;
			document.body.classList.remove('timer-dragging');
		}, { once: true })
		
		window.addEventListener('touchend', () => {
			this.dragging = false;
			this.draggingOriginalX = 0;
			document.body.classList.remove('timer-dragging');
		}, { once: true })
	
	}



	onMousemove(x) {
		if(!this.dragging) return;

		document.body.classList.add('timer-dragging');

		const movementDistance = this.draggingOriginalValue + (x - this.draggingOriginalX);		
		const newValue = MathUtils.clamp(MathUtils.map(movementDistance, 0, this.draggingRangeW, -1, 1), -1, 1);
		
		this.timer.style.setProperty('--thumb-x', `${MathUtils.map(newValue, -1, 1, 0, 1)}`);
		this.range.valueAsNumber = newValue;
		this.value = newValue;		
		
	}

	addEventListeners(): void {
		
		this.icon.addEventListener('mousedown', (e) => {
			this.onMousedown(e.clientX);
			if(this.state === STATE.ACTIVE) return;
			this.state = STATE.ACTIVE;
			this.changeState();
		})
		this.icon.addEventListener('touchstart', (e) => {			
			this.onMousedown(e.touches[0].clientX);
			if(this.state === STATE.ACTIVE) return;
			this.state = STATE.ACTIVE;
			this.changeState();
		})

		window.addEventListener('mousemove', (e) => {
			this.onMousemove(e.clientX);
		})
		window.addEventListener('touchmove', (e) => {
			this.onMousemove(e.touches[0].clientX);
		})

		this.resetButton.addEventListener('click', () => {	
			this.reset()
		})

		this.pauseButton.addEventListener('click', () => {	
			this.pause();
		})

		this.editButton.addEventListener('click', () => {
			this.state = STATE.EDIT;
			this.toggleSubPanel();
		})


		const buttons = document.querySelectorAll(`[data-panel-button="${this.id}"]`);
		if(buttons.length === 0) return;		

		for(const button of buttons){
			button.addEventListener('click', () => { 							
				if(this.state === STATE.ACTIVE) {					
					this.state = this.value === 0 ? STATE.HIDDEN : STATE.HIDDEN_EDITED;
				} else {
					this.state = STATE.ACTIVE;
				}
				this.changeState();
			})
		}
		
	}

	reset(){		
		solarClock.setDate();
		this.subPanel.dateInputReset();
		this.pause();
	}

	pause(){
		this.range.valueAsNumber = 0;
		this.timer.style.setProperty('--thumb-x', `0.5`);
		this.value = 0;
		CLOCK_SETTINGS.speed = this.value * CLOCK_SETTINGS.maxSpeed;
	}

	toggleSubPanel(){
		if(this.state === STATE.EDIT) {
			this.subPanel.togglePanel();
			this.state = STATE.HIDDEN;
			this.changeState();
		} else this.subPanel.closePanel(true);
	}

	closePanel(): void {			
		this.state = this.value === 0 ? STATE.HIDDEN : STATE.HIDDEN_EDITED;
		this.changeState();
	}

	changeState(){
		this.timer.setAttribute('state', `${this.state}`);

		if(this.state === STATE.HIDDEN){
			this.arrowsTlReverse();
			setTimeout(() => {
				this.timer.classList.remove('on-top');
			}, 500);
			this.dom.classList.remove('active');
		}

		if(this.state === STATE.HIDDEN_EDITED){
			this.arrowsTlReverse();
			setTimeout(() => {
				this.timer.classList.remove('on-top');
			}, 500);
			this.dom.classList.remove('active');
		}

		if(this.state === STATE.ACTIVE){
			this.timer.classList.add('on-top');			
			this.arrowsTlPlay();
			this.dom.classList.add('active');
		}
	}

	arrowsTlPlay(){
		this.arrowsTl.timeScale(1.2);
		this.arrowsTl.play();
	}
	arrowsTlReverse(){
		this.arrowsTl.timeScale(5);
		this.arrowsTl.reverse();
	}

	initClock(){
		
		for(const tick of this.clockTicks){
			tick.style.transformOrigin = '50% 50%';
		}

	}

	updateClock(){

		const getHours = () => {
			const h = date.getHours();
			return h > 12 ? h - 12 : h;
		}

		const date = this.date; 	
		const t = performance.now() * 0.001;
		this.animationValue = MathUtils.lerp(this.animationValue, this.value, 0.8);
		date.setTime(Date.now() + (this.animationValue * 20000000) * t);
		const m = date.getMinutes();
		const h = getHours();

		const r1 = MathUtils.map(m, 0, 59, 0, 354);
		const r2 = MathUtils.map(h, 1, 12, 30, 360);				

		this.clockTicks[0].style.transform = `rotate(${r1}deg)`
		this.clockTicks[1].style.transform = `rotate(${r2}deg)`		
		
	}

	update(): void {

		const date = formatDate(solarClock.currentDate);

		this.updateClock();
		
		if(this.state === STATE.HIDDEN) return;
		
		this.domDate.innerText = date;		
		
		CLOCK_SETTINGS.speed = this.value * CLOCK_SETTINGS.maxSpeed;

	}
}

const createArrowsTl = ():GSAPTimeline => {
	const tl = gsap.timeline({ paused: true });

	tl.addLabel('start', 0.2)

	const wrapper = document.querySelector('.timer-chevs');

	// Set all paths to alpha 0
	const paths = wrapper.querySelectorAll('path');
	for(const path of paths) {
		gsap.set(path, { autoAlpha: 0 })
	}

	const past = wrapper.querySelectorAll('[class^="past"]');
	const future = wrapper.querySelectorAll('[class^="future"]');

	for(let i = 0; i<=2; i++){

		const ii = i + 1;

		const distance = window.innerWidth < 678 ? window.innerWidth * 0.05 : 60;		
		const initialOffset = window.innerWidth < 678 ? 5 : 40;
		const distanceBetweenChevrons = 7;

		gsap.set(past[i].querySelectorAll('path'), {
			x: (index, element) => {
				const offset = distanceBetweenChevrons * index;
				return (distance * ii) + offset - initialOffset;
			},
		})
		gsap.set(future[i].querySelectorAll('path'), {
			x: (index, element) => {
				const offset = distanceBetweenChevrons * index;
				return -(distance * ii) - offset + initialOffset;
			},
		})

		const pastTween = gsap.to(past[i].querySelectorAll('path'), {
			x: (index, element) => {
				const offset = distanceBetweenChevrons * index;
				return (distance * ii) + offset
			},
			autoAlpha: 1,
			ease: 'expo.out',
			duration: 1.5,
			stagger: 0.1
		})
		const futureTween = gsap.to(future[i].querySelectorAll('path'), {
			x: (index, element) => {
				const offset = distanceBetweenChevrons * index;
				return -(distance * ii) - offset
			},
			autoAlpha: 1,
			ease: 'expo.out',
			duration: 1.5,
			stagger: 0.1
		})

		const start = 0.2 * ii;
		tl.add(pastTween, `start+=${start}`)
		tl.add(futureTween, `start+=${start}`)

	}


	return tl;
}
