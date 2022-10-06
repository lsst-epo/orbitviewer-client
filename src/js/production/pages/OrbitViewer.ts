import { CameraManager } from "../../common/core/CameraManager";
import { CoreApp, CoreAppSingleton } from "../../common/core/CoreApp";
import { Search } from "../partials/Search";
import { addPanelListener, PanelsListener } from "../ui/panels/PanelsManager";
import { popups, updatePopups } from "../ui/popups/PopupsManager";
import { Page } from "./Page";


export class OrbitViewer extends Page implements PanelsListener {
	customizeViewWrapper: HTMLElement;
	active:boolean = false;

	bgStars: HTMLInputElement;
	load(resolve: any): void {
	
		new Search(this.dom);

		this.customizeViewWrapper = this.dom.querySelector('.customize-view');
		this.bgStars = this.customizeViewWrapper.querySelector('input[name="background-stars"]');

		super.load(resolve)

		addPanelListener(this);

	}

	closePanel(): void {						
		if(!this.active) return;
		this.customizeViewWrapper.classList.remove('active');
	}

	addEventListeners(): void {
	
		this.addCustomizeView();

		this.addCameraReset();
		
	}

	hide(): void {
		super.hide();
		
		if(!this.bgStars.checked) {
			this.bgStars.checked = true;
			for(const input of this.inputs.inputs) input.checkState();
			this.toggleStars();
		}
	}

	toggleStars(){
		CoreAppSingleton.instance.backgroundVisibility = this.bgStars.checked;
	}

	togglePanel(){		

		this.active = !this.active;
		this.customizeViewWrapper.classList.toggle('active');

		if(this.active){
			this.customizeViewWrapper.classList.add('to-front');
		} else {
			setTimeout(() => {
				this.customizeViewWrapper.classList.remove('to-front');
			}, 500);
		}

	}
	
	addCustomizeView(){

		// Handles main tab
		const btn = this.customizeViewWrapper.querySelector('.customize-view-icon');
		btn.addEventListener('click', () => {
			this.togglePanel();
		})

		// Sub tabs
		this.bgStars.addEventListener('change', () => {
			this.toggleStars();			
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
		updatePopups();
	}
}