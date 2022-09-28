import { CustomizeOrbits } from "../pages/CustomizeOrbits";
import { GuidedExperienceTour } from "../pages/GuidedExperienceTour";
import { OrbitViewer } from "../pages/OrbitViewer";
import { Page } from "../pages/Page";

export const PAGES = [];

// ------------------------------------------ Helpers
export const getPage = (slug:string) => {
	const page = PAGES.filter(page => slug.includes(page.id));			
	return page.length === 0 ? PAGES.find(page => page.id.includes('landing')) : page[page.length - 1];
}

export const getUrl = (page) => {
	return `/${getLanguage()}/${page.slug}`
}

export const getLanguage = () => {
	const docLang = document.documentElement.getAttribute('lang');
	const lang = docLang.includes('en') ? 'en' : 'es';
	return lang;
}


export const pagesRecap = () => {

	// -- LOCATION - HISTORY
	const tempPages = [
		'landing',
		'customize-orbits',
		'guided-experiences',
		'orbit-viewer',
		'about',
	];

	let pageClass = null;

	//  -------------------------------- Create pages
	for(const pageSlug of tempPages){
		
		if(pageSlug === 'orbit-viewer'){
			pageClass = new OrbitViewer();
		} else if(pageSlug === 'customize-orbits'){
			pageClass = new CustomizeOrbits();
		} else {
			pageClass = new Page();
		}

		const pageItem = {
			id: pageSlug,
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
		
		pageClass = new Page();

		const pageItem = {
			id: pageSlug,
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
			id: page.slug,
			slug: `${page.tourPicker[0].slug}/${page.slug}`,
			class: pageClass,
			template: null,
			title: null
		}

		PAGES.push(pageItem);
	}
}
