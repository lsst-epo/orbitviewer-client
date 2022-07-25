import { el } from '@jocabola/utils';

let popup = null;

export const createPopup = (title:string = null, withTimes:boolean = true, timesCallback:Function = () => {}) => {

	if(popup) {
		console.log('Popup already active');
		removePopup();
		console.log('Previous popup removed');
	}

	popup = el('div', 'popup');

	const content = el('div', 'popup__content');

	popup.appendChild(content);

	if(withTimes){
		const times = el('button', 'popup__times ui__button ui_button-icon ui__close');
		times.innerHTML = `
			<svg class="ui__icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 15 15" xml:space="preserve">
				<title>Close</title>
				<path d="M14.7,0.4c0.4,0.4,0.4,0.9,0,1.3L8.8,7.5l5.9,5.8c0.4,0.6,0.4,1.1,0.2,1.3 c-0.6,0.6-1.1,0.6-1.3,0.2c0,0,0,0-0.2-0.2L7.5,8.8l-5.9,5.8c-0.6,0.6-1.1,0.6-1.3,0.2s-0.4-0.9-0.2-1.3c0,0,0,0,0.2-0.2l5.9-5.8	L0.3,1.7c-0.4-0.4-0.4-0.9-0.2-1.3C0.5,0,1.1,0,1.4,0.4c0,0,0,0,0.2,0.2l5.9,5.6l5.9-5.8C13.7-0.1,14.3-0.1,14.7,0.4L14.7,0.4z"></path>
			</svg>
		`;
		popup.appendChild(times);

		times.addEventListener('click', () => {
			timesCallback();
			removePopup();
		}, { once: true });
	}

	if(title){
		const titleDom = el('h3');
		titleDom.innerText = title;
		popup.appendChild(titleDom);
		popup.classList.add('popup__title')
	}

	document.body.appendChild(popup);

	document.body.classList.add('popup__active');

	return content;
}

export const removePopup = () => {
	
	popup.remove();
	document.body.classList.remove('popup__active');
	popup = null;

} 