import gsap from "gsap/all";
import { Checkbox } from "../Checkbox";

export class PlanetsMoons extends Checkbox {
	create(){
		this.tl = gsap.timeline({ paused: true });

		const all = this.dom.parentElement.querySelector('svg .all');
		const circles = this.dom.parentElement.querySelectorAll('svg circle');
		const planet = this.dom.parentElement.querySelector('svg .planet');

		gsap.set(all, {
			scale: 0.7,
			transformOrigin: 'center',
			autoAlpha: 0.3
		})
		gsap.set(circles, {
			autoAlpha: 0,
			transformOrigin: 'center',
		})
		gsap.set(planet, {
			rotation: -15,
			transformOrigin: 'center',
		})

		this.tl
			.addLabel('start')
			.to(all, {
				autoAlpha: 1,
				scale: 1,		
				ease: 'power2.inOut',
				duration: 0.5,
			}, 'start')
			.to(circles, {
				autoAlpha: 1,
				ease: 'power2.inOut',
				duration: 1,
				stagger: 0.3
			}, 'start')
			.to(planet, {
				rotation: 0,
				ease: 'power1.inOut',
				duration: 1,
			}, 'start')

	}
}