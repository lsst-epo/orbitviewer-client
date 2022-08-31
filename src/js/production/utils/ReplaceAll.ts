export const replaceAll = (replaceThis:string, forThis:string, inThis:string) => {
	var re = new RegExp(replaceThis, 'g');
	return inThis.replace(re, forThis);
}