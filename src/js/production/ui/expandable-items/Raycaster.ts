import { PerspectiveCamera } from "three";
import { OrthographicCamera } from "three";
import { Object3D } from "three";
import { Raycaster } from "three";


export const RAYCASTER = {
	instance: null,
	active: false,
	watch: [],
	// instersects: null
}

export const POINTER = {
	x: 0,
	y: 0
}

export const initRaycaster = () => {
	RAYCASTER.instance = new Raycaster();

	window.addEventListener('pointermove', (e) => {
		POINTER.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		POINTER.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
	})

	// Raycaster Click
	document.addEventListener('click', (ev) => {	
		if(!RAYCASTER.active) return;
		if(RAYCASTER.watch.length === 0) return;
		const intersects = RAYCASTER.instance.intersectObjects(RAYCASTER.watch);

		console.log(intersects);
		
		// RAYCASTER.instersects = intersects.length > 0 ? intersects[0] : null;
	})
}

export const updateRaycasterWatch = (elements:Array<Object3D>) => {

	console.log(RAYCASTER.watch);
	

	RAYCASTER.watch = [...elements, ...RAYCASTER.watch];
}

export const updateRaycaster = (camera:PerspectiveCamera | OrthographicCamera ) => {

	if(!RAYCASTER.active) return;
	if(RAYCASTER.watch.length === 0) return;	

	RAYCASTER.instance.setFromCamera(POINTER, camera);


}

