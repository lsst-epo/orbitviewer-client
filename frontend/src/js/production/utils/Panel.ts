
interface Panel {
	panel: HTMLElement,
	active: boolean,
	id: string
}

export class Panels {
	dom: HTMLElement;
	panels: Array<Panel> = [];
	constructor(dom: HTMLElement = null){
		if(!!!dom) return;

		this.dom = dom;

		this.createPanels();
		this.addListeners();

	}

	createPanels(){

		const panels = this.dom.querySelectorAll('[data-panel]');

		for(const item of panels){

			const id = item.getAttribute('data-panel');
			if(!!!item) continue;

			const panel = {
				id,
				active: false,
				panel: item as HTMLElement
			}
			this.panels.push(panel);

		}

	}

	addListeners(){

		for(const panel of this.panels){
			const buttons = document.querySelectorAll(`[data-panel-button="${panel.id}"]`);
			if(buttons.length === 0) continue;

			for(const button of buttons){
				button.addEventListener('click', () => {
					panel.active = !panel.active;

					if(panel.active){
						panel.panel.classList.add('active');
					} else {
						panel.panel.classList.remove('active');
					}
				})
			}
		}
	}
}