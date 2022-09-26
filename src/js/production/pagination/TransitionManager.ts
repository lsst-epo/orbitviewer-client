import { DEV } from '../../common/core/Globals';
import { LOCATION } from "./History";
import { gsap } from 'gsap/dist/gsap';


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

	if(!!!pages.from) {
		console.log('Init Transitions');
		InitialFadeIn();
		return;
	}

	if(DEV) console.log('Page transition - From:', pages.from.template,'To:', pages.to.template);

	DefaultTransition();
}

const InitialFadeIn = (skip:boolean = false) => {
	gsap.to(['html', '.page__content'], {
		duration: 0.2,
		autoAlpha: 1,
		ease: 'power1.inOut',
		onComplete: () => {
			EndTransition();
		}
	})
}

const DefaultTransition = () => {
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
	tl.to(LOCATION.current.class.dom, {
		autoAlpha: 1,
	}, 'start')

	if(LOCATION.previous) {
		tl.to(LOCATION.previous.class.dom, {
			autoAlpha: 0,
		}, 'start')
	}

	tl.play();
}
