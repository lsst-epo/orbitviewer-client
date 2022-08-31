import { REVISION } from 'three';
import { TOOL_VERSION, USER } from '../../../common/core/Globals';
import { COPIES } from '../../core/GlobalsEditor';

const logToggle: HTMLElement = document.querySelector('#console');
const logItemDom: HTMLElement = document.querySelector('#console-tab');
const pickers: NodeListOf<HTMLElement> = logItemDom.querySelectorAll('[data-picker]');
const times: HTMLElement = logItemDom.querySelector('.ui__button');

export const toggleLog = () => {
	logToggle.classList.toggle('selected');
	logItemDom.classList.toggle('hidden');
};

export const openLog = () => {
	logToggle.classList.add('selected');
	logItemDom.classList.remove('hidden');
};

export const setLogToMessage = () => {
	const tab: HTMLElement = pickers[0];
	tab.click();
};

export const setLogToConsole = () => {
	const tab: HTMLElement = pickers[1];
	tab.click();
};

// Write new message to Console Message tab
export const writeMessageToConsole = (logs, forceOpen: boolean = false) => {
	if (forceOpen) {
		openLog();
		setLogToMessage();
	}

	const tempLogs = typeof logs === 'string' ? [logs] : logs;

	const wrapper = document.querySelector('#console-tab [data-tab="messages"]');
	for (const log of tempLogs) {
		wrapper.innerHTML += `<p>${log}</p>`;
	}
	wrapper.scrollTop = wrapper.scrollHeight;
};

// Update Console
const updateLog = (logs, type = 'normal', forceOpen:boolean=false) => {

	const tempLogs = typeof logs === 'string' ? [logs] : logs;
	const wrapper = document.querySelector('#console-tab [data-tab="log"]');

	for (const log of tempLogs) {
		wrapper.innerHTML += `<p class="${type}">${log}</p>`;
	}

	wrapper.scrollTop = wrapper.scrollHeight;

    if(forceOpen) {
        setLogToConsole();
        openLog();
    }
};

export const Log = {
	
    log: (msg, forceOpen:boolean=false) => {
        updateLog(msg, 'normal', forceOpen);
    },

    warn: (msg, forceOpen:boolean=false) => {
        updateLog(msg, 'warning', forceOpen);
    },

    error: (msg, forceOpen:boolean=false) => {
        updateLog(msg, 'error', forceOpen);
    },

    message: (msg, forceOpen:boolean=false) => {
        writeMessageToConsole(msg);
        if(forceOpen) {
            setLogToMessage();
            openLog();
        }
    }
}

// Init Console
export const initLog = () => {
	// rewriteLog();

	//  Default messages
	writeMessageToConsole(`FiL Toolkit - v${TOOL_VERSION}`);
	writeMessageToConsole(`Powered by Threejs - v${REVISION}`);
	writeMessageToConsole(`...`);
	writeMessageToConsole(`${COPIES.console.initialMessage} ${USER.name}`);

	// Default logs
	Log.log(`Console ready and standing by...`);

	times.addEventListener('click', () => {
		toggleLog();
	});

	// CONSOLE LOG PANE BUTTONS (log tabs)
	for (const picker of pickers) {
		picker.addEventListener('click', () => {
			logItemDom.setAttribute('data-active', picker.getAttribute('data-picker'));
		});
	}
};
