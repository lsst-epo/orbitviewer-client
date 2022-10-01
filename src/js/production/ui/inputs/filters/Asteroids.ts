import gsap from "gsap/all";
import { Checkbox } from "../Checkbox";


export class Asteroids extends Checkbox {
	create(){
		this.tl = gsap.timeline({ paused: true });

		const all = this.dom.parentElement.querySelector('svg .all');
		const paths = this.dom.parentElement.querySelectorAll('svg .all path');

		gsap.set(paths, {
			scale: 0.5,
			transformOrigin: 'center'
		})
		gsap.set(all, {
			autoAlpha: 0.3
		})
		gsap.set(paths[0], {
			rotation: 50
		})
		gsap.set(paths[1], {
			rotation: -50
		})
		gsap.set(paths[2], {
			rotation: 30
		})


		this.tl
			.addLabel('start')
			.to(all, {
				autoAlpha: 1,
				duration: 0.5,
			}, 'start')
			.to(paths, {
				scale: 1,
				duration: 1,
				rotation: 0,
				stagger: 0.2,
				ease: 'power1.inOut'
			}, 'start')
	}
}