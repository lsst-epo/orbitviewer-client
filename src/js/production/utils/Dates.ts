const checkLength = (num:number) : string => {
	const number: string = (num < 10 ? `0${num}` : num).toString();
	return number;
}

const getMonth = (num:number) : string => {

	const isES = document.documentElement.getAttribute('lang') === 'es-ES';

	const months = isES ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	
	return months[num];
}

export const getFormatDate = (date:Date) => {

	const d = {	
		y: checkLength(date.getFullYear()),
		m: checkLength(date.getMonth() + 1),
		month: getMonth(date.getMonth()),
		d: checkLength(date.getDate()),
		h: checkLength(date.getHours()),
		min: checkLength(date.getMinutes()),
		s: checkLength(date.getSeconds())
	}	

	return d;
}

export const formatDate = (date:Date) => {

	const d = getFormatDate(date);

	const isES = document.documentElement.getAttribute('lang') === 'es-ES';	

	const formattedDate = isES ? `${d.d} de ${d.month}, ${d.y} - ${d.h}:${d.min}:${d.s}` : `${d.month} ${d.d}, ${d.y} - ${d.h}:${d.min}:${d.s}`;

	return formattedDate;
}

export const formatDateString = (date:Date) => {

	const d = getFormatDate(date);

	const isES = document.documentElement.getAttribute('lang') === 'es-ES';	

	const formattedDate = isES ? `${d.d} de ${d.month}, ${d.y}` : `${d.month} ${d.d}, ${d.y}`;

	return formattedDate;
}

