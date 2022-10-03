import gsap from "gsap";
import { Checkbox } from "../Checkbox";


export class NearEarthObjects extends Checkbox {
	create(){
		this.tl = gsap.timeline({ paused: true });

		const all = this.dom.parentElement.querySelector('svg .all');
		const circle = this.dom.parentElement.querySelector('svg .circle');
		const dots = this.dom.parentElement.querySelectorAll('svg .dots path');
		const earth = this.dom.parentElement.querySelectorAll('svg .earth');

		gsap.set(dots, {
			autoAlpha: 0
		})
		gsap.set(all, {
			autoAlpha: 0.3
		})
		gsap.set(circle, {
			y: 25,
			autoAlpha: 0,
		})
		gsap.set(earth, {
			scale: 0.8,
			transformOrigin: 'center'
		})

		this.tl.timeScale(1.2);

		this.tl
			.addLabel('start')
			.to(all, {
				autoAlpha: 1,
				duration: 0.5,
			}, 'start')
			.to(earth, {
				scale: 1,
				duration: 0.5,
			}, 'start')
			.to(dots, {
				autoAlpha: 1,
				stagger: 0.1,
				duration: 1,
			}, 'start')
			.to(circle, {
				y: 0,
				duration: 1,
				autoAlpha: 1,
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