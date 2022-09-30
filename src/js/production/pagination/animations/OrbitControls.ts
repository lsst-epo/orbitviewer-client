import { LOCATION } from "../History";

export const OrbitControlsOut = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.previous.class.dom;
	const slide = dom.querySelectorAll('[data-animation-type="slide"]');

	const left = dom.querySelectorAll('[data-animation-type="control-left"]');
	const right = dom.querySelectorAll('[data-animation-type="control-right"]');
	const bottom = dom.querySelectorAll('[data-animation-type="control-bottom"]');

	tl.to(slide, {
		autoAlpha: 0,
		y: '10px',
		duration: 0.3
	}, label)

}
export const OrbitControlsIn = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.current.class.dom;
	const control = dom.querySelectorAll('[data-animation-type^="control-"]');

	const duration = 0.4;

	tl.to(control, {
		autoAlpha: 1,
		y: 0,
		x: 0,
		duration
	}, label)
}
