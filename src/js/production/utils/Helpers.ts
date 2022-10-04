
export const isPortrait = ():boolean => {
	const w = window.innerWidth;
	const h = window.innerHeight;
	return w < h;
}

export const setWindowRatioMode = () => {
	const doc = document.documentElement;
	doc.classList.remove('landscape', 'portrait');

	if(isPortrait()) doc.classList.add('portrait');
	else doc.classList.add('landscape');
}

export const setDeviceType = () => {        
	const doc = document.documentElement;
	doc.classList.remove('desktop', 'device');

	// 1024 same in media queries	
	if(window.innerWidth > 1024) doc.classList.add('desktop');
	else doc.classList.add('device')
}

export const setDeviceHeight = () => {
	const doc = document.documentElement
	doc.style.setProperty('--doc-height', `${window.innerHeight}px`)
}