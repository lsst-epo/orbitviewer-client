import { LOCATION } from "../History";

export const SlideOut = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.previous.class.dom;
	const slide = dom.querySelectorAll('[data-animation-type="slide"]');
	
	if(slide.length === 0) return;

	tl.to(slide, {
		autoAlpha: 0,
		y: '10px',
		duration: 0.3
	}, label)
}
export const SlideIn = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.current.class.dom;
	const slide = dom.querySelectorAll('[data-animation-type="slide"]');

	if(slide.length === 0) return;

	tl.to(slide, {
		autoAlpha: 1,
		y: 0,
		duration: 0.3
	}, label)
}
