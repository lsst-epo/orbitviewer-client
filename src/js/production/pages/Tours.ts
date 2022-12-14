import gsap from "gsap";
import { Page } from "./Page";


export class Tours extends Page {
	chevs:NodeListOf<HTMLElement>;
	playing: boolean = false;

	onLoaded(){
		this.chevs = this.dom.querySelectorAll('.tour-pagination svg');
	}

	playChev(chev, direction){
		if(this.playing) return;
		this.playing = true;

		gsap.to(chev, {
			duration: 0.6,
			x: direction === 'left' ? '-=10px' : '+=10px',
			scaleY: 0.9,
			transformOrigin: 'center',
			ease: 'power2.inOut',
			onComplete: () => {
				gsap.to(chev, {
					duration: 0.6,
					x: 0,
					scaleY: 1,
					transformOrigin: 'center',
					ease: 'power2.inOut',
					onComplete: () => {
						this.playing = false;
					}
				});
			}
		})

	}

	addEventListeners(): void {
		super.addEventListeners();
		console.log(this.chevs);
		
		this.chevs[0].addEventListener('mouseenter', () => {
			this.playChev(this.chevs[0], 'left')
		})
		this.chevs[1].addEventListener('mouseenter', () => {
			this.playChev(this.chevs[1], 'right')
		})
	}



}