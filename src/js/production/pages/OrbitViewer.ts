import { CameraManager } from "../../common/core/CameraManager";
import { onChange } from "../pagination/History";
import { Search } from "../partials/Search";
import { popups } from "../ui/popups/PopupsManager";
import { RAYCASTER } from "../ui/popups/Raycaster";
import { Page } from "./Page";


export class OrbitViewer extends Page {
	load(resolve: any): void {
	
		new Search(this.dom);

		super.load(resolve)

	}

	show(): void {
		RAYCASTER.active = true;
	}

	hide(): void {
		super.hide();
		RAYCASTER.active = false;
	}

	addEventListeners(): void {
	
		this.addCustomizeView();

		this.addCameraReset();
		
	}

	addCustomizeView(){

		const wrapper = this.dom.querySelector('.customize-view');

		const btn = wrapper.querySelector('.customize-view-icon');
		btn.addEventListener('click', () => {
			wrapper.classList.toggle('active');
		})

		document.addEventListener('keydown', (e) => {			
			if(e.key != 'Escape') return;
			if(!wrapper.classList.contains('active')) return;
			wrapper.classList.remove('active');
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
		for(const popup of popups) popup.label.update();
	}
}