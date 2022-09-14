import { saveData } from '../../data/DataSaver';
import { initLog, toggleLog } from '../helpers/Log';
import { uiManager } from '../uiManager';
import { uiSet } from '../uiSet';
import { MenuItem } from './MenuItem';

const containerRef = {
	value: null,
};

function fetchContainer() {
	if (containerRef.value != null && containerRef.value != undefined) return;
	containerRef.value = document.querySelector('.ui__top-bar').querySelector('.ui__top-bar_right');
}

export const menuItems: Array<MenuItem> = [];

export class menuManager {
	static clear() {
		for (const item of menuItems) item.clear();
	}

	static get(id: string) {
		return menuItems.find((x) => x.id === id);
	}

	static add(el: HTMLElement, set: uiSet): MenuItem {
		const item = new MenuItem(el, set);
		fetchContainer();
		containerRef.value.classList.remove('hidden');
		menuItems.push(item);
		return item;
	}

	static remove(item: MenuItem) {
		item.clear();
		fetchContainer();
		containerRef.value.classList.add('hidden');
		menuItems.splice(menuItems.indexOf(item), 1);
	}

	static addEventListeners() {
		// OPEN SIMULATOR BUTTON
		document.querySelector('#open-sim').addEventListener('click', () => {
			window.open('/production', '_blank').focus();
		});

		// SAVE DATA BUTTON
		document.querySelector('#save-data').addEventListener('click', () => {
			saveData();
		});

		// CONSOLE LOG BUTTON
		const logToggle = document.querySelector('#console');
		logToggle.addEventListener('click', (ev) => {
			toggleLog();
		});

		// Init console log
		initLog();

		window.addEventListener('keydown', (ev) => {
			const code = ev.code;

			// Check if input has focus
			if (document.activeElement.classList.contains('tp-txtv_i')) return;

			// Check Menu items
			const item = menuItems.find((x) => x.key === code);

			if (item) {
				ev.preventDefault();
				if (item.visible) {
					item.clear();
				} else {
					item.select();
				}
				return;
			}

			// Hide all with tab
			if (code === 'Tab') {
				ev.preventDefault();
				uiManager.switchVisibility();
				return;
			}

			// ctrl + key
			const button = document.querySelector(`[data-button-key="${code}"]`) as HTMLElement;
			if (button) {
				ev.preventDefault();
				button.click();
				return;
			}
			// ctrl + key
			const buttonCtrl = document.querySelector(`[data-button-key="${code}+ctrlKey|metaKey"], [data-button-key="${code}"]`) as HTMLElement;
			if (buttonCtrl && (ev.ctrlKey || ev.metaKey)) {
				ev.preventDefault();
				buttonCtrl.click();
				return;
			}
		});
	}
}
