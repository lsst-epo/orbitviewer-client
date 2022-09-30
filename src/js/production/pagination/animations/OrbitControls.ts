import { LOCATION } from "../History";

export const OrbitControlsOut = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.previous.class.dom;

	const left = dom.querySelectorAll('[data-animation-type="control-left"]');
	if(left.length > 0){
		tl.to(left, {
			autoAlpha: 0,
			x: '-10px',
			duration: 0.3
		}, label)
	}

	const right = dom.querySelectorAll('[data-animation-type="control-right"]');
	if(right.length > 0){
		tl.to(right, {
			autoAlpha: 0,
			x: '10px',
			duration: 0.3
		}, label)
	}

	const bottom = dom.querySelectorAll('[data-animation-type="control-bottom"]');
	if(bottom.length > 0){
		tl.to(bottom, {
			autoAlpha: 0,
			y: '10px',
			duration: 0.3
		}, label)
	}


}
export const OrbitControlsIn = (tl:GSAPTimeline, label:string) => {
	const dom = LOCATION.current.class.dom;
	const control = dom.querySelectorAll('[data-animation-type^="control-"]');

	if(control.length === 0) return;

	tl.to(control, {
		autoAlpha: 1,
		y: 0,
		x: 0,
		duration: 0.4
	}, label)
}
