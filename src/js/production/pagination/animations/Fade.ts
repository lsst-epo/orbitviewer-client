import { LOCATION } from "../History";

export const FadeOut = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.previous.class.dom;
	const fade = dom.querySelectorAll('[data-animation-type="fade"]');
	
	if(fade.length === 0) return;

	tl.to(fade, {
		autoAlpha: 0,
		duration: 0.3
	}, label)
}
export const FadeIn = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.current.class.dom;
	const fade = dom.querySelectorAll('[data-animation-type="fade"]');

	if(fade.length === 0) return;

	tl.to(fade, {
		autoAlpha: 1,
		duration: 0.3
	}, label)
}
