
import { DEV } from "../../common/core/Globals";
import { Page } from "../pages/Page"; 
import { get } from "../utils/Ajax";
import { replaceAll } from "../utils/ReplaceAll";
import { TRANSITIONS, TriggerTransition } from "./TransitionManager";

// -- LOCATION - HISTORY
const tempPages = [
	'landing',
	'about'
];

export const LOCATION = {
	current: null,
	previous: null,
	popstate: false,
}

export const PAGES = [];
let pageClass = null;
for(const pageSlug of tempPages){
	
	pageClass = new Page();
	
	const pageItem = {
		slug: pageSlug === 'landing' ? '' : pageSlug,
		class: pageClass,
		template: null,
		title: null
	}

	PAGES.push(pageItem);
}

export const historyTriggerLink = (slug:string = null) => {
	if(!slug) return;	
	onChange(slug);
}

export const historyBack = () => {
	let link = LOCATION.previous ? LOCATION.previous.slug : '';				
	historyTriggerLink(`/${link}`);
}

export const historyLinksEventListener = () => {

	const links = document.querySelectorAll('a');
	const hostname = window.location.hostname;
	
	for(const link of links){
		if (link.href.indexOf(hostname) || !link.hasAttribute('target')) {			
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
	historyLinksEventListener();
	
	if(DEV) console.log('Site pages --> ', PAGES);

	let path = replaceAll("/", "", window.location.pathname);		
	const page = PAGES.find(page => page.slug === path);	

	LOCATION.current = page;
	page.class.dom = document.querySelector('.page__content');	
	page.template = page.class.dom.parentNode.getAttribute('data-template');

	page.class.prepare().then(() => {		

		document.body.classList.add(`page__${LOCATION.current.template}`);
		// Replace title
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
	LOCATION.previous = LOCATION.current;
	const slug = replaceAll("/", "", url);
	LOCATION.current = PAGES.find(page => page.slug === slug);	

	// IF PAGE IS LOADED
	if(LOCATION.current.class.loaded){
		onRequest();
		LOCATION.current.class.prepare();
	// OR LOAD PAGE
	} else {		
		get(url).then(response => {
			onRequestNotLoaded(response) 
		})
	}
}

const onRequest = () => {
	
	if(!LOCATION.popstate){	
		window.history.pushState({}, document.title, `/${LOCATION.current.slug}`);
	}	

	document.title = LOCATION.current.title;

	if(LOCATION.previous) document.body.classList.remove(`page__${LOCATION.previous.template}`);
	document.body.classList.add(`page__${LOCATION.current.template}`);
	
	// RESET LOCATION
	// Posar popstate a true si es event amb els next-prev del browser
	TriggerTransition(LOCATION.popstate);
	LOCATION.popstate = false;
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
