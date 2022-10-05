const checkLength = (num:number) : string => {
	const number: string = (num < 10 ? `0${num}` : num).toString();
	return number;
}

export const getFormatDate = (date:Date) => {

	const d = {	
		y: checkLength(date.getUTCFullYear()),
		m: checkLength(date.getUTCMonth() + 1),
		d: checkLength(date.getUTCDate()),
		h: checkLength(date.getUTCHours()),
		min: checkLength(date.getUTCMinutes()),
		s: checkLength(date.getUTCSeconds())
	}	

	return d;
}

export const formatDate = (date:Date) => {

	const d = getFormatDate(date);

	const isES = document.documentElement.getAttribute('lang') === 'es-ES';	

	const formattedDate = isES ? `${d.d}/${d.m}/${d.y} - ${d.h}:${d.min}:${d.s}` : `${d.m}/${d.d}/${d.y} - ${d.h}:${d.min}:${d.s}`;

	return formattedDate;
}

export const formatDateString = (date:Date) => {

	const d = getFormatDate(date);

	const isES = document.documentElement.getAttribute('lang') === 'es-ES';	

	const formattedDate = isES ? `${d.d}.${d.m}.${d.y}` : `${d.m}.${d.d}.${d.y}`;

	return formattedDate;
}

