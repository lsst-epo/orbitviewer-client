import gsap from "gsap/all";


let active = false;

const loader = document.querySelector('.loader');
const svg = loader.querySelector('svg');
const elements = svg.querySelectorAll('path, circle');

const tl = gsap.timeline({ paused: true, repeat: -1 })

const resetTl = () => {
	tl.pause();
	tl.progress(0);

	gsap.set(svg, {
		transformOrigin: 'center',
		scale: 0.5,
	})
}

resetTl();

export const showLoader = () => {
	if(active) return;
	active = true;
	document.body.classList.add('loader-active');

	tl.play();

	gsap.to(loader, {
		autoAlpha: 1,
		duration: 0.4,
		ease: 'power1.inOut'
	})
	gsap.to(svg, {
		scale: 1,
		duration: 0.5,
		ease: 'power1.inOut'
	})
}

export const hideLoader = () => {
	
	if(!active) return;
	active = false;
	document.body.classList.remove('loader-active');

	gsap.to(loader, {
		autoAlpha: 0,
		duration: 0.3,
		ease: 'power1.inOut',
		onComplete: () => {
			resetTl();
		}
	})
}