import gsap from "gsap/all";


let active = false;

const loader = document.querySelector('.loader');
const svg = loader.querySelector('svg');
const elements = svg.querySelectorAll('path, circle');

const tl2 = gsap.timeline({ paused: true, repeat: -1 })
const tl1 = gsap.timeline({ paused: true, repeat: -1 })

tl1
	.addLabel('start')
	.to(svg, {
		transformOrigin: 'center',
		rotate: '+=360',
		ease: 'linear',
		duration: 50
	})

tl2
	.set(elements, { autoAlpha: 0 })
	.addLabel('start')
	.to(elements, {
		stagger: 0.04,
		autoAlpha: 1,
		duration: 0.6,
		ease: 'power3.out'
	})
	.to(elements, {
		delay: 0.5,
		autoAlpha: 0,
		duration: 1,
		ease: 'power2.out'
	})

const resetTl = () => {
	tl1.pause();
	tl1.progress(0);
	tl2.pause();
	tl2.progress(0);

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

	tl1.play();
	tl2.play();

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