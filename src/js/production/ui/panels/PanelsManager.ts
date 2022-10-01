

export interface PanelsListener {
	closePanel():void;
}

const panelsListeners: Array<PanelsListener> = [];

export const addPanelListener = (listener: PanelsListener) => {
	if(panelsListeners.includes(listener)) return;
	panelsListeners.push(listener);
}

export const broadcastPanelsClose = () => {
	for(const listener of panelsListeners) listener.closePanel();
}