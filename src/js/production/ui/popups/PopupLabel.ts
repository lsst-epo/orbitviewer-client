import { MathUtils } from "@jocabola/math";
import { Vector3 } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CameraManager } from "../../../common/core/CameraManager";
import { SolarCategory } from "../../../common/data/Categories";
import { addFiltersListener, filters, FiltersListener } from "../../../common/data/FiltersManager";
import { InteractiveObject } from "../../../common/solar/SolarElement";
import { LOCATION } from "../../pagination/History";
import { css2D } from "./Css2D";
import { enablePopup } from "./PopupsManager";

export class PopupLabel {
	dom: HTMLElement;
	css2DElement: CSS2DObject;

	name: string; 
	category: SolarCategory;

	container: HTMLElement;
	ref: InteractiveObject;

	visible: boolean = false;
	active: boolean = false;

	tmp: Vector3 = new Vector3();

	constructor(dom){
		
		this.dom = dom;
		this.css2DElement = new CSS2DObject(this.dom);
		css2D.add(this.css2DElement);

		this.container = this.dom.querySelector('.icon');
		
		this.name = this.dom.getAttribute('data-name');	

	}

	loaded(){
		this.addEventListeners();
		if(LOCATION.current.id === 'orbit-viewer') this.dom.classList.remove('hidden');
	}

	addEventListeners(){

		this.dom.addEventListener('click', (ev) => {							
			enablePopup(this.name);
		})

	}

	select(){
		this.ref.selected = true;
		this.dom.classList.add('selected');
		if(this.ref.closeUp) this.dom.classList.add('no-info-hidden');		
		CameraManager.goToTarget(this.ref, false, !this.ref.closeUp);
	}

	unselect(){
		this.ref.selected = false;
		this.dom.classList.remove('selected');
	}

	update(){		
		if(!!!this.ref) return;

		if(LOCATION.current.id === 'orbit-viewer') this.dom.classList.remove('hidden');
		else this.dom.classList.add('hidden');

		this.css2DElement.position.copy(this.ref.position);

		const d = this.ref.position.distanceTo(CameraManager.cam.position);		
		const scale = MathUtils.clamp(MathUtils.map(d, 5000, 60000, 1, 0.2), 0.2, 1);
		this.container.style.transform = `translate(-50%, 50%) scale3d(${scale}, ${scale}, 1)`;

	}
}
