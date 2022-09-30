import { DEV } from '../../common/core/Globals';
import { LOCATION } from "./History";
import { gsap } from 'gsap/dist/gsap';
import { SlideIn, SlideOut } from './animations/Slide';
import { OrbitControlsIn, OrbitControlsOut } from './animations/OrbitControls';


export const TRANSITIONS = {
	inProgress: false
}

const pages = {
	from: null,
	to: null
}

export const EndTransition = () => {
	TRANSITIONS.inProgress = false;
	if(pages.from) {
		pages.from.class.disable();		
	}
}

export const TriggerTransition = (skip:boolean = false) => {
	if(LOCATION.current === null) return;
	if(TRANSITIONS.inProgress) return;

	TRANSITIONS.inProgress = true;
	
	pages.from = LOCATION.previous;
	pages.to = LOCATION.current;	
	
	pages.to.class.active = true;

	if(DEV) {
		if(!LOCATION.previous) console.log('Init transitions. Page transition To:', LOCATION.current.template);
		if(LOCATION.previous) console.log('Page transition - From:', LOCATION.previous.template, 'To:', LOCATION.current.template);
	}

	Transition();
}

const Transition = () => {
	const tl = gsap.timeline({
		paused: true,
		defaults: {
			duration: 0.2,
			ease: 'power1.inOut',
		},
		onComplete: () => {
			EndTransition();
		},
	});

	console.log('Transition');
	
	tl.add('start')

	// Previous leave
	console.log(LOCATION.previous);

	let label = 'start';
	let id = LOCATION.current.id;
	
	if(!LOCATION.previous){
		tl.to('body', {	autoAlpha: 1 }, label)
	} else {
		CreateTl('out', tl, label);
	}

	
	// Current enter
	label = 'start+=0.5';
	id = LOCATION.current.id;
	CreateTl('in', tl, label);

	tl.play();
}

const CreateTl = (dir: string, tl:GSAPTimeline, label:string) => {

	if(dir === 'in'){
		SlideIn(tl, label);
		OrbitControlsIn(tl, label);
		return;
	}

	SlideOut(tl, label);
	OrbitControlsOut(tl, label);

}

