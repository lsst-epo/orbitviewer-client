export function str_minify(str: string): string {
	let s = str.replace('\n', '');
	s = s.replace('\r', '');
	return s.replace(' ', '').trim();
}

export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
