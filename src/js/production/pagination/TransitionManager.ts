import { DEV } from '../../common/core/Globals';
import { LOCATION } from "./History";
import { SlideIn, SlideOut } from './animations/Slide';
import { OrbitControlsIn, OrbitControlsOut } from './animations/OrbitControls';
import { FadeIn, FadeOut } from './animations/Fade';
import gsap, { ScrollToPlugin } from 'gsap/all';

gsap.registerPlugin(ScrollToPlugin);

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
	
	tl.add('start')

	let label = 'start';
	if(!LOCATION.previous){
		tl.to('body', {	autoAlpha: 1 }, label)
	} else {
		CreateTl('out', tl, label);
	}

	tl.set(LOCATION.current.class.dom, {
		scrollTo: 0
	})

	
	// Current enter
	label = 'start+=0.4';
	CreateTl('in', tl, label);

	tl.play();
}

const CreateTl = (dir: string, tl:GSAPTimeline, label:string) => {

	if(dir === 'in'){
		SlideIn(tl, label);
		FadeIn(tl, label);
		OrbitControlsIn(tl, label);
		return;
	}

	SlideOut(tl, label);
	FadeOut(tl, label);
	OrbitControlsOut(tl, label);

}

