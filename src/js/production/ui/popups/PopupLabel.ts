import { MathUtils } from "@jocabola/math";
import { Vector3 } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CameraManager } from "../../../common/core/CameraManager";
import { css2D } from "./Css2D";
import { enablePopup } from "./PopupsManager";
import { InteractiveObject } from "./Raycaster";

export class PopupLabel {
	dom: HTMLElement;
	css2DElement: CSS2DObject;

	name: string; 

	container: HTMLElement;
	ref: InteractiveObject;

	visible: boolean = false;
	active: boolean = false;

	tmp: Vector3 = new Vector3();

	constructor(dom){
		
		this.dom = dom;
		this.css2DElement = new CSS2DObject(this.dom);
		css2D.add(this.css2DElement);

		this.container = this.dom.querySelector('.item-scale-wrapper');
		
		this.name = this.dom.getAttribute('data-name');	

	}

	loaded(){
		this.addEventListeners();
	}

	addEventListeners(){

		this.dom.addEventListener('click', (ev) => {							
			enablePopup(this.name);
		})

	}

	select(){
		this.ref.selected = true;
		CameraManager.goToTarget(this.ref);
	}

	unselect(){
		this.ref.selected = false;
	}

	update(){		
		if(!!!this.ref) return;

		this.css2DElement.position.copy(this.ref.target.position);	

		const d = this.ref.target.position.distanceTo(CameraManager.cam.position);
		const alpha = MathUtils.clamp( MathUtils.map(d, 80, 150, 1, 0), 0, 1).toString();

		this.css2DElement.element.style.opacity = alpha;

	}
}
