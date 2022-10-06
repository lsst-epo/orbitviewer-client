import { DEV } from "../../common/core/Globals";
import { get } from "../utils/Ajax";
import { getPage, getUrl, PAGES, pagesRecap } from "./PagesRecap";
import { TRANSITIONS, TriggerTransition } from "./TransitionManager";

export const LOCATION = {
	current: null,
	previous: null,
	popstate: false,
}

// ------------------------------------------ History
export const historyTriggerLink = (slug:string = null) => {
	if(!slug) return;	
	onChange(slug);
}

export const historyBack = () => {
	const page = LOCATION.previous ? LOCATION.previous : getPage('landing')			
	historyTriggerLink(page.slug);
}

export const historyLinksEventListener = () => {

	const links = document.querySelectorAll('a');
	const hostname = window.location.hostname;
	
	for(const link of links){

		if(link.hasAttribute('data-onchange') || link.hasAttribute('target') || link.hasAttribute('no-history')) continue;

		if (link.href.indexOf(hostname)) {	
			
			link.setAttribute('data-onchange', 'true');
			
			link.addEventListener('click', (e) => {				
				e.preventDefault();
				e.stopPropagation();				
				onChange(link.getAttribute('href'));
			});
		}
	}
}

// INIT
export const historyInit = () => {			
	console.log('History init');
	
	pagesRecap();
	
	historyLinksEventListener();
	
	if(DEV) console.log('Site pages --> ', PAGES);

	LOCATION.current = getPage(window.location.pathname);
	
	const dom = document.querySelector('.page__content');
	LOCATION.current.class.dom = dom;
	LOCATION.current.template = dom.getAttribute('data-template');

	LOCATION.current.class.prepare().then(() => {		

		document.body.classList.add(`page__${LOCATION.current.template}`);
		LOCATION.current.title = document.querySelector('title').textContent;

		TriggerTransition()
	});

}

export const onChange = (url:string = window.location.pathname) => {		
	
	// CHECK IF PAGE IS LOADING
	if(TRANSITIONS.inProgress){
		console.log('Page transition already in progress');
		return;
	}

	// GET PAGE
	const page = getPage(url);

	console.log('Loading...', page, url);
	
	if(page === LOCATION.current) return;	

	LOCATION.previous = LOCATION.current;
	LOCATION.current = page;
	

	// IF PAGE IS LOADED
	if(LOCATION.current.class.loaded){
		onRequest();
		LOCATION.current.class.prepare();
		
	// OR LOAD PAGE
	} else {						
		get(getUrl(page)).then(response => {			
			onRequestNotLoaded(response) 
		})
	}
}

const onRequestNotLoaded = (response) => {	
	
	// Get new DOM
	const html = document.createElement('div')
	html.innerHTML = response;

	// Get new page DOM
	const dom = html.querySelector('.page__content');
	LOCATION.current.class.dom = dom;
	LOCATION.current.template = dom.getAttribute('data-template');
	document.querySelector('.site__wrapper').appendChild(dom);
	
	LOCATION.current.class.prepare().then(() => {
		// Replace title
		LOCATION.current.title = html.querySelector('title').textContent;
		onRequest();
	});

}

const onRequest = () => {

	console.log('Loading complete');
	
	if(!LOCATION.popstate){	
		window.history.pushState({}, document.title, getUrl(LOCATION.current));
	}	

	document.title = LOCATION.current.title;

	if(LOCATION.previous) document.body.classList.remove(`page__${LOCATION.previous.template}`);
	document.body.classList.add(`page__${LOCATION.current.template}`);
	
	// RESET LOCATION
	historyLinksEventListener();
	TriggerTransition(LOCATION.popstate);
	LOCATION.popstate = false;
}


