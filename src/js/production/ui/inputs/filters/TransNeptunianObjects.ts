import gsap from "gsap/all";
import { Checkbox } from "../Checkbox";


export class TransNeptunianObjects extends Checkbox {
	create(){
		this.tl = gsap.timeline({ paused: true });

		const all = this.dom.parentElement.querySelector('svg .all');

		gsap.set(all, {
			scale: 0.7,
			transformOrigin: 'center',
			autoAlpha: 0.3
		})


		this.tl
			.addLabel('start')
			.to(all, {
				autoAlpha: 1,
				scale: 1,		
				ease: 'power2.inOut',
				duration: 0.5,
			}, 'start')
	}
}