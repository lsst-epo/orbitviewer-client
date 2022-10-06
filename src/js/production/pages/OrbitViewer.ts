import { CameraManager } from "../../common/core/CameraManager";
import { CoreAppSingleton } from "../../common/core/CoreApp";
import { Search } from "../partials/Search";
import { addPanelListener, PanelsListener } from "../ui/panels/PanelsManager";
import { updatePopups } from "../ui/popups/PopupsManager";
import { Page } from "./Page";


export class OrbitViewer extends Page implements PanelsListener {
	customizeViewWrapper: HTMLElement;
	active:boolean = false;

	bgStarsInput: HTMLInputElement;
	toggleLabelsInput: HTMLInputElement;
	load(resolve: any): void {
	
		new Search(this.dom);

		this.customizeViewWrapper = this.dom.querySelector('.customize-view');
		this.bgStarsInput = this.customizeViewWrapper.querySelector('input[name="background-stars"]');
		this.toggleLabelsInput = this.customizeViewWrapper.querySelector('input[name="toggle-labels"]');

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
		
		if(!this.bgStarsInput.checked) {
			this.bgStarsInput.checked = true;
			this.toggleStars();
		}

		if(!this.toggleLabelsInput.checked) {
			this.toggleLabelsInput.checked = true;
			this.toggleLabels();
		}

		for(const input of this.inputs.inputs) input.checkState();
	}

	toggleStars(){
		CoreAppSingleton.instance.backgroundVisibility = this.bgStarsInput.checked;
	}

	toggleLabels(){
		document.body.classList.toggle('customize-labels-hidden');
		document.body.classList.add('customize-labels-fast-transition');
		setTimeout(() => {
			document.body.classList.remove('customize-labels-fast-transition');
		}, 500);
		CoreAppSingleton.instance.planetsVisibility = this.toggleLabelsInput.checked;
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
		this.bgStarsInput.addEventListener('change', () => {
			this.toggleStars();			
		})
		this.toggleLabelsInput.addEventListener('change', () => {
			this.toggleLabels();			
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