import { copyToClipboard } from "@jocabola/utils";
import { getLanguage } from "../pagination/PagesRecap";


export const shareInit = (dom:HTMLElement) => {
	// console.log('Share ready');

	const mail = dom.querySelectorAll('.share-button.email') as NodeListOf<HTMLLinkElement>;
	for(const link of mail) shareEmail(link);

	const url = dom.querySelectorAll('.share-button.get-url') as NodeListOf<HTMLLinkElement>;
	for(const link of url) shareURL(link);

	const tw = dom.querySelectorAll('.share-button.twitter') as NodeListOf<HTMLLinkElement>;
	for(const link of tw) shareTwitter(link);

	const fb = dom.querySelectorAll('.share-button.facebook') as NodeListOf<HTMLLinkElement>;
	for(const link of fb) shareFacebook(link);

	const urlSolarItems = dom.querySelectorAll('.popup-info .copy-button') as NodeListOf<HTMLLinkElement>;
	for(const link of urlSolarItems) shareURL(link, true);
	
	
}

const shareFacebook = (dom:HTMLLinkElement) => {
	const text = dom.getAttribute('data-text');
	dom.removeAttribute('data-text');	
	dom.setAttribute('href', `https://www.facebook.com/sharer/sharer.php?quote=${text}&u=${window.location.href}`) 
}

const shareTwitter = (dom:HTMLLinkElement) => {
	const text = dom.getAttribute('data-text');
	dom.removeAttribute('data-text');
	dom.setAttribute('href', `http://twitter.com/share?text=${text}&url=${window.location.href}`) // &hashtags=hashtag1,hashtag2,hashtag3
}

const shareEmail = (dom:HTMLLinkElement) => {

	const subject = dom.getAttribute('data-subject');
	const body = dom.getAttribute('data-body');

	dom.removeAttribute('data-subject');
	dom.removeAttribute('data-body');

	dom.setAttribute('href', `mailto:?subject=${subject};body=${body} ${window.location.href}`)
}

const shareURL = (dom:HTMLLinkElement, solarItem:boolean = false) => {

	const url = solarItem ?`${window.location.origin}/${getLanguage()}/orbit-viewer/${dom.getAttribute('data-id')}` : `${window.location.href}`

	dom.addEventListener('click', () => {
		copied(dom);
		copyToClipboard(url)
	})
}

const copied = (dom:HTMLLinkElement) => {
	dom.classList.add('copied');
	setTimeout(() => {
		dom.classList.remove('copied');
	}, 1500);
}