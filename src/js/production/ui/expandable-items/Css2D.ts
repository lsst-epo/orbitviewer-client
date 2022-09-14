import { PerspectiveCamera, Scene } from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const scene = new Scene();
const renderer = new CSS2DRenderer();
const cam = new PerspectiveCamera(45, 1, 0, 100);
let initialized = false;

export class css2D {
	static init (width:number, height:number) {
		if(initialized) return;
		initialized = true;
		console.log('Init CSS 3D Renderer');
		document.body.appendChild(renderer.domElement);
		renderer.domElement.classList.add('css2D__wrapper', 'expandable-items')
		renderer.setSize(width, height);
		// scene.add(cam);
	}

	static render(camera:PerspectiveCamera) {
		if(!initialized) return;
		
		cam.copy(camera);
		// cam.position.multiplyScalar(CSS_SCALE_UP);
		renderer.render(scene, cam);
		// cam.position.multiplyScalar(CSS_SCALE_DOWN);
	}

	static add(el:CSS2DObject) {
		scene.add(el);
	}

	static setSize(width:number, height:number) {	
		renderer.setSize(width, height);
	}
}
