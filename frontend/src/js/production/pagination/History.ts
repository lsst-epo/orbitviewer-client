import { DEV } from "../../common/core/Globals";
import { CustomizeOrbits } from "../pages/CustomizeOrbits";
import { GuidedExperiences } from "../pages/GuidedExperiences";
import { GuidedExperienceTour } from "../pages/GuidedExperienceTour";
import { Landing } from "../pages/Landing";
import { OrbitViewer } from "../pages/OrbitViewer";
import { Page } from "../pages/Page";
import { Tours } from "../pages/Tours";
import { get } from "../utils/Ajax";
import { replaceAll } from "../utils/ReplaceAll";
import { TRANSITIONS, TriggerTransition } from "./TransitionManager";


// -- LOCATION - HISTORY
const tempPages = [
	'landing',
	'customize-orbits',
	'guided-experiences',
	'orbit-viewer',
	'about',
];




export const LOCATION = {
	current: null,
	previous: null,
	popstate: false,
}

export const PAGES = [];
let pageClass = null;

//  -------------------------------- Create pages
for(const pageSlug of tempPages){
	
	if(pageSlug === 'landing'){
		pageClass = new Landing();
	} else if(pageSlug === 'customize-orbits'){
		pageClass = new CustomizeOrbits();
	} else if(pageSlug === 'orbit-viewer'){
		pageClass = new OrbitViewer();
	} else if(pageSlug === 'guided-experiences'){
		pageClass = new GuidedExperiences();
	} else {
		pageClass = new Page();
	}

	const pageItem = {
		slug: pageSlug === 'landing' ? '' : pageSlug,
		class: pageClass,
		template: null,
		title: null
	}

	PAGES.push(pageItem);
}

// ------------------------------------------ TOURS
const tours = [];
for(const tour of data.tours){
	tours.push(tour.slug);
}
for(const pageSlug of tours){
	
	pageClass = new Tours();

	const pageItem = {
		slug: pageSlug,
		class: pageClass,
		template: null,
		title: null
	}

	PAGES.push(pageItem);
}

// ------------------------------------------ Guided Experiences

for(const page of data.guidedExperiencesTours){	

	pageClass = new GuidedExperienceTour();

	const pageItem = {
		slug: `${page.tourPicker[0].slug}/${page.slug}`,
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

		if(link.hasAttribute('data-onchange')) continue;

		if (link.href.indexOf(hostname) || !link.hasAttribute('target')) {	
			
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
	historyLinksEventListener();
	
	if(DEV) console.log('Site pages --> ', PAGES);

	let path = window.location.pathname;	
	if(path.charAt(0) === '/') path = path.substring(1);
	if(path.charAt(path.length - 1) === '/') path = path.substring(0, path.length - 1);

	const page = PAGES.find(page => page.slug === path);	

	LOCATION.current = page;
	
	page.class.dom = document.querySelector('.page__content');	
	page.template = page.class.dom.getAttribute('data-template');

	page.class.prepare().then(() => {		

		document.body.classList.add(`page__${LOCATION.current.template}`);
		// Replace title
		LOCATION.current.title = document.querySelector('title').textContent;

		TriggerTransition()
	});
}

export const onChange = (url:string = window.location.pathname) => {		

	console.log(url, PAGES);
	

	// CHECK IF PAGE IS LOADING
	if(TRANSITIONS.inProgress){
		console.log('Page transition already in progress');
		return;
	}

	// GET PAGE
	let slug = url;
	if(slug.charAt(0) === '/') slug = slug.substring(1);
	if(slug.charAt(slug.length - 1) === '/') slug = slug.substring(0, slug.length - 1);

	if(slug === LOCATION.current.slug) return;

	LOCATION.previous = LOCATION.current;
	LOCATION.current = PAGES.find(page => page.slug === slug);		

	// IF PAGE IS LOADED
	if(LOCATION.current.class.loaded){
		onRequest();
		LOCATION.current.class.prepare();
		
	// OR LOAD PAGE
	} else {				
		get('/' + slug).then(response => {
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
	historyLinksEventListener();
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
