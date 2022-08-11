import { gsap } from 'gsap/dist/gsap';
import { DEV } from '../../common/core/Globals';
import { LOCATION } from "./History";

export const TRANSITIONS = {
	inProgress: false
}

const pages = {
	from: null,
	to: null
}

export const EndTransition = () => {
	TRANSITIONS.inProgress = false;
	if(pages.from) pages.from.class.disable();		
	// navigationUpdate();
}

export const TriggerTransition = (skip:boolean = false) => {
	if(LOCATION.current === null) return;
	if(TRANSITIONS.inProgress) return;

	TRANSITIONS.inProgress = true;
	
	pages.from = LOCATION.previous;
	pages.to = LOCATION.current;	
	
	pages.to.class.active = true;

	if(!!!pages.from) {
		InitialFadeIn();
		return;
	}

	if(DEV) console.log('TRANSITION - From:', pages.from.template,'To:', pages.to.template);

	// Aqui es fa la transició

	// Fallback if nothing happens
	console.log('No transition for this pages!', pages.from.template, pages.to.template);
	EndTransition();
}

const InitialFadeIn = (skip:boolean = false) => {
	gsap.to('html', {
		delay: 0.5,
		duration: 0.3,
		autoAlpha: 1,
		ease: 'power1.inOut',
		onComplete: () => {
			EndTransition();
		}
	})
}

