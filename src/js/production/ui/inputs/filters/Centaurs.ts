import gsap from "gsap";
import DrawSVGPlugin from "gsap/DrawSVGPlugin";
import { Checkbox } from "../Checkbox";
gsap.registerPlugin(DrawSVGPlugin);


export class Centaurs extends Checkbox {
	create(){
		this.tl = gsap.timeline({ paused: true });

		const all = this.dom.parentElement.querySelector('svg .all');
		const dots = this.dom.parentElement.querySelectorAll('svg .dots path');
		const arrow = this.dom.parentElement.querySelector('svg .arrow');
		const stroke = this.dom.parentElement.querySelector('svg .stroke');

		gsap.set(all, {
			scale: 0.7,
			transformOrigin: 'center',
			autoAlpha: 0.3
		})

		gsap.set(dots, {
			autoAlpha: 0
		})
		gsap.set(arrow, {
			scaleX: 0,
			transformOrigin: 'center'
		})
		gsap.set(stroke, {
			drawSVG: '0%'
		})

		this.tl
			.addLabel('start')
			.to(all, {
				autoAlpha: 1,
				scale: 1,		
				ease: 'power2.inOut',
				duration: 0.5,
			}, 'start')
			.to(dots, {
				autoAlpha: 1,
				stagger: 0.1,
				duration: 1,
			}, 'start')
			.to(stroke, {
				drawSVG: '100%',
				duration: 1,
			}, 'start')
			.to(arrow, {
				scaleX: 1,
				duration: 0.2,
			}, 'start+=0.8')
	}

	play(): void {
		this.tl.timeScale(1.2)
		this.tl.play();
	}

	reverse(): void {
		this.tl.timeScale(1.5);
		this.tl.reverse(1);
	}
}