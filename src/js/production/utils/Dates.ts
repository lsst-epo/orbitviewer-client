const checkLength = (num:number) : string => {
	const number: string = (num < 10 ? `0${num}` : num).toString();
	return number;
}

export const getFormatDate = (date:Date) => {

	const d = {	
		y: checkLength(date.getFullYear()),
		m: checkLength(date.getMonth() + 1),
		d: checkLength(date.getDate()),
		h: checkLength(date.getHours()),
		min: checkLength(date.getMinutes()),
		s: checkLength(date.getSeconds())
	}	

	return d;
}

export const formatDate = (date:Date) => {

	const d = getFormatDate(date)

	const formattedDate = `${d.m}/${d.d}/${d.y} - ${d.h}:${d.min}:${d.s}`;

	return formattedDate;
}

