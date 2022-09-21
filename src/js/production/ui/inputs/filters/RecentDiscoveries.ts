import gsap from "gsap/all";
import { Checkbox } from "../Checkbox";


export class RecentDiscoveries extends Checkbox {
	create(){
		this.tlIn = gsap.timeline({ paused: true });
		this.tlOut = gsap.timeline({ paused: true });

		const bg = this.dom.parentElement.querySelector('svg .rd-bg');
		const exc = this.dom.parentElement.querySelector('svg .rd-exclamation');

		gsap.set([bg, exc], {
			scale: 0.7,
			autoAlpha: 0.5,
			transformOrigin: 'center'
		})

		gsap.set(bg, {
			rotate: 180
		})

		this.tlIn
			.addLabel('start')
			.to([bg, exc], {
				autoAlpha: 1,
				duration: 0.5,
				ease: 'power1.out'
			}, 'start')
			.to(bg, {
				scale: 1,
				ease: 'power1.out',
				duration: 0.5,
			}, 'start')
			.to(exc, {
				scale: 1,
				ease: 'elastic.out',
				duration: 1,
			}, 'start+=0.2')
			.to(bg, {
				rotate: 0,
				duration: 2,
				ease: 'power1.out'
			}, 'start')

		this.tlOut
			.addLabel('start')
			.to([bg, exc], {
				scale: 0.7,
				autoAlpha: 0.5,
				ease: 'power1.out',
				duration: 0.5,
			}, 'start')


	}
}