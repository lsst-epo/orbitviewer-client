import gsap from "gsap/all";
import { Checkbox } from "../Checkbox";


export class RecentDiscoveries extends Checkbox {
	create(){
		this.tl = gsap.timeline({
			paused: true
		});

		const bg = this.dom.parentElement.querySelector('svg .rd-bg');
		const exc = this.dom.parentElement.querySelector('svg .rd-exclamation');



		gsap.set([bg, exc], {
			scale: 0,
			transformOrigin: 'center'
		})

		gsap.set(bg, {
			rotate: 180
		})

		this.tl
			.addLabel('start')
			.to(bg, {
				scale: 1,
				ease: 'power1.out',
				duration: 0.5,
			}, 'start')
			.to(exc, {
				scale: 1,
				ease: 'elastic.out',
				duration: 1,
			}, 'start+=0.5')
			.to(bg, {
				rotate: 0,
				duration: 2,
				ease: 'power1.out'
			}, 'start')



	}
}