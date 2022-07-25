import { el } from '@jocabola/utils';
import { Pane } from 'tweakpane';

import { PresetObject } from 'tweakpane/dist/types/blade/root/api/preset';

export type uiSetOptions = {
    onChange?: Function;
    close?: boolean;
    onClose?: Function;
}

export class uiSet {
	pane: Pane;
	dom: HTMLDivElement;

	id: string;
	updated: boolean;

	constructor(id: string = '', opts:uiSetOptions) {
		this.id = id;
		this.updated = false;
		this.dom = el('div', 'ui__set') as HTMLDivElement;
		this.pane = new Pane({
			container: this.dom,
		});

        this.pane.on('change', (ev) => {
			this.updated = true;			
			if(opts.onChange) opts.onChange(ev);
		});

		if (opts.close && opts.close === true) {
			const closeBtn = document.querySelector('.ui__reference.ui__close').cloneNode(true) as HTMLButtonElement;
			closeBtn.classList.remove('ui__reference');
			closeBtn.style.display = 'unset';
			this.dom.appendChild(closeBtn);
			closeBtn.addEventListener('click', () => {		
				this.close();		
				if(opts.onClose) opts.onClose();
			});
		}
	}

	close(){

	}

	export(): string {
		return JSON.stringify(this.pane.exportPreset());
	}

	import(preset: PresetObject) {
		this.pane.importPreset(preset);
		this.onImport(preset);
	}

	onImport(preset: PresetObject) {}

	clear() {}
}
