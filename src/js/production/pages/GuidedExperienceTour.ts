import { onChange } from "../pagination/History";
import { Page } from "./Page";

interface slides {
	index: number,
	type: string,
	active: boolean,
	dom: HTMLElement
}


export class GuidedExperienceTour extends Page {
	slides:Array<slides> = [];
	activeSlide: number = 0;

	onLoaded(){
		this.createSlides();
	}

	createSlides() {

		const slides = this.dom.querySelectorAll('[data-slide]');

		for(const slide of slides){
			const slideItem = {
				index: parseInt(slide.getAttribute('data-slide-index')),
				type: slide.getAttribute('data-slide'),
				active: false,
				dom: slide as HTMLElement
			}
			this.slides.push(slideItem)
		}

		this.slides[0].active = true;		
	}

	addEventListeners(): void {
		super.addEventListeners();

		for(const slide of this.slides){
			const buttons = slide.dom.querySelectorAll('.buttons__wrapper button');

			for( const button of buttons){
				const id = button.getAttribute('data-button');
				const type = id.includes('prev') ? 'prev' : id.includes('next') ? 'next' : 'share';

				button.addEventListener('click', () => {
					if(type === 'prev') {
						this.prev();
						return;
					}
					if(type === 'next') {
						this.next();
						return;
					}
					if(type === 'share') {
						this.share();
						return;
					}
				})
			}

		}


	}

	share(){
		console.log('Share click');
	}

	prev(){
		console.log('Prev click');
		if(this.activeSlide === 0){
			const slug = this.slides[0].dom.getAttribute('data-parent-slug');
			onChange(slug)
			return;
		}

		this.activeSlide--;
		this.move();	
	}

	next(){
		console.log('Next click');
		this.activeSlide++;

		if(this.activeSlide >= this.slides.length) this.activeSlide = 0;

		this.move();	
	}

	move(){
		for(const slide of this.slides){
			slide.active = false;
			slide.dom.classList.remove('active')
		}

		this.slides[this.activeSlide].dom.classList.add('active');
	}
}