import gsap, { MorphSVGPlugin } from "gsap/all";
import { Checkbox } from "../Checkbox";

gsap.registerPlugin(MorphSVGPlugin);


export class Comets extends Checkbox {
	create(){
		this.tl = gsap.timeline({ paused: true });

		const all = this.dom.parentElement.querySelector('svg .all');
		const path = this.dom.parentElement.querySelector('svg .all .path');
		const p1 = path.getAttribute('d');
		const p2 = path.getAttribute('data-morph');

		gsap.set(all, {
			scale: 0.7,
			transformOrigin: 'center',
			autoAlpha: 0.3
		})
		gsap.set(path, {
			morphSVG: p1
		})


		this.tl
			.addLabel('start')
			.to(all, {
				autoAlpha: 1,
				scale: 1,		
				ease: 'power2.inOut',
				duration: 0.5,
			}, 'start')
			.to(path, {
				duration: 0.6,
				ease: 'linear',
				morphSVG: p2
			}, 'start')
			.to(path, {
				duration: 0.6,
				ease: 'linear',
				morphSVG: p1
			})
			.to(path, {
				duration: 0.6,
				ease: 'linear',
				morphSVG: p2
			})
			.to(path, {
				duration: 0.6,
				ease: 'linear',
				morphSVG: p1
			})
	}
}