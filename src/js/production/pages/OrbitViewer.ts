import { CameraManager } from "../../common/core/CameraManager";
import { Search } from "../partials/Search";
import { addPanelListener, PanelsListener } from "../ui/panels/PanelsManager";
import { popups } from "../ui/popups/PopupsManager";
import { RAYCASTER } from "../ui/popups/Raycaster";
import { Page } from "./Page";


export class OrbitViewer extends Page implements PanelsListener {
	customizeViewWrapper: HTMLElement;
	load(resolve: any): void {
	
		new Search(this.dom);

		this.customizeViewWrapper = this.dom.querySelector('.customize-view');

		super.load(resolve)

		addPanelListener(this);

	}

	show(): void {
		RAYCASTER.active = true;
	}

	hide(): void {
		super.hide();
		RAYCASTER.active = false;
	}

	closePanel(): void {
		if(!this.customizeViewWrapper.classList.contains('active')) return;
		this.customizeViewWrapper.classList.remove('active');
	}

	addEventListeners(): void {
	
		this.addCustomizeView();

		this.addCameraReset();
		
	}

	addCustomizeView(){

		

		const btn = this.customizeViewWrapper.querySelector('.customize-view-icon');
		btn.addEventListener('click', () => {
			this.customizeViewWrapper.classList.toggle('active');
		})

		document.addEventListener('keydown', (e) => {			
			if(e.key != 'Escape') return;
			this.closePanel();
		})


	}

	addCameraReset(){
		const button = this.dom.querySelector('.orbit-controls-reset');
		button.addEventListener('click', () => {
			CameraManager.reset();
		})
	}

	update(): void {
		super.update();
		for(const popup of popups) {
			popup.label.visible = popup.visible;
			popup.label.update();
		}
	}
}