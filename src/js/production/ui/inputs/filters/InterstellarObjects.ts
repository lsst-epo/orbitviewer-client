import gsap from "gsap";
import { Checkbox } from "../Checkbox";


export class InterstellarObjects extends Checkbox {
	create(){
		this.tl = gsap.timeline({ paused: true });

		const all = this.dom.parentElement.querySelector('svg .all');
		const center = this.dom.parentElement.querySelectorAll('svg .center');
		const paths = this.dom.parentElement.querySelectorAll('svg .small path');

		gsap.set(paths, {
			scale: 0.5,
			transformOrigin: 'center'
		})
		gsap.set(center, {
			scale: 0.1,
			transformOrigin: 'center'
		})
		gsap.set(all, {
			autoAlpha: 0.3
		})


		this.tl
			.addLabel('start')
			.to(all, {
				autoAlpha: 1,
				duration: 0.5,
			}, 'start')
			.to(paths, {
				scale: 1,
				duration: 0.5,
				rotation: 0,
				stagger: 0.1,
				ease: 'elastic.out'
			}, 'start')
			.to(center, {
				scale: 1,
				duration: 1,
				rotation: 0,
				ease: 'power2.inOut'
			}, 'start')
	}

	play(): void {
		this.tl.timeScale(1)
		this.tl.play();
	}

	reverse(): void {
		this.tl.timeScale(1.5);
		this.tl.reverse(1);
	}
}