import { PerspectiveCamera, Scene } from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { initPopups } from './PopupsManager';

const scene = new Scene();
const renderer = new CSS2DRenderer();
const cam = new PerspectiveCamera(45, 1, 0, 100);
let initialized = false;

export class css2D {
	static init (width:number, height:number) {
		if(initialized) return;
		initialized = true;
		console.log('Init CSS 2D Renderer');
		document.body.appendChild(renderer.domElement);
		renderer.domElement.classList.add('popups-wrapper')
		renderer.setSize(width, height);

		initPopups();

	}

	static render(camera:PerspectiveCamera) {
		if(!initialized) return;

		cam.copy(camera);
		renderer.render(scene, cam);
	}

	static add(el:CSS2DObject) {
		scene.add(el);
	}

	static setSize(width:number, height:number) {	
		renderer.setSize(width, height);
	}
}
