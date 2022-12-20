import { CameraManager } from "../../common/core/CameraManager";
import { CoreAppSingleton } from "../../common/core/CoreApp";
import { Search } from "../partials/Search";
import { shareInit } from "../partials/Share";
import { addInputs, inputInterface, inputs } from "../ui/inputs/InputsManager";
import { addPanelListener, addPanels, panels, PanelsListener } from "../ui/panels/PanelsManager";
import { TimePickerPanel } from "../ui/panels/TimePickerPanel";
import { popups, updatePopups } from "../ui/popups/PopupsManager";
import { Page } from "./Page";


export class OrbitViewer extends Page implements PanelsListener {
	customizeViewWrapper: HTMLElement;
	active:boolean = false;

	bgStarsInput: inputInterface;
	toggleLabelsInput: inputInterface;
	load(resolve: any): void {

		new Search(this.dom);

		shareInit(this.dom);

		addInputs();
		addPanels();

		this.customizeViewWrapper = this.dom.querySelector('.customize-view');

		this.bgStarsInput = inputs.find(x => x.name === 'background-stars');
		this.toggleLabelsInput = inputs.find(x => x.name === 'toggle-labels');

		this.loaded = true;	

		this.onLoaded();
		this.addEventListeners();

		addPanelListener(this);		

		this.enable(resolve);
	}

	closePanel(): void {						
		this.customizeViewWrapper.classList.remove('active');
	}

	addEventListeners(): void {
	
		this.addCustomizeView();

		this.addCameraReset();
		
	}

	hide(): void {
		this.bgStarsInput.input.checked = true;
		this.bgStarsInput.input.checkState();
		this.toggleStars();

		this.toggleLabelsInput.input.checked = true;
		this.toggleLabelsInput.input.checkState();
		this.toggleLabels();

		const timePicker = panels.find(x => x.id === 'time-picker') as TimePickerPanel;
		timePicker.leave();
	}

	toggleStars(){
		CoreAppSingleton.instance.backgroundVisibility = this.bgStarsInput.input.checked;
	}

	toggleLabels(){		
		for(const popup of popups) {
			if(this.toggleLabelsInput.input.checked) popup.label.dom.classList.remove('customize-hidden');
			else popup.label.dom.classList.add('customize-hidden');
		}

		CoreAppSingleton.instance.orbitsVisibility = !this.toggleLabelsInput.input.checked;
	}

	togglePanel(){		

		this.active = !this.active;
		this.customizeViewWrapper.classList.toggle('active');

	}
	
	addCustomizeView(){

		// Handles main tab
		const btn = this.customizeViewWrapper.querySelector('.customize-view-icon');
		btn.addEventListener('click', () => {
			this.togglePanel();
		})

		// // Sub tabs
		this.bgStarsInput.input.dom.addEventListener('change', () => {
			this.toggleStars();			
		})
		this.toggleLabelsInput.input.dom.addEventListener('change', () => {
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