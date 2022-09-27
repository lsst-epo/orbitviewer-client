import { getCategory } from "../data/Categories";
import { OrbitElements, OrbitType } from "./SolarSystem"

export type OrbitDataElements = {
    id:string;
    fulldesignation:string;
    node:number;
    a:number;
    e:number;
    Name?:string;
    G?:number;
    incl:number;
    H?:number;
    q?:number;
    M:number;
    n:number;
    tperi?:number;
    peri:number;
    category:string
}

export function getOrbitType(el:OrbitDataElements): OrbitType {
    if(el.e < 0.98) {
        return OrbitType.Elliptical;
    } else if(el.e < 1.2) {
        if(el.e === 1) {
            return OrbitType.Parabolic;
        } else {
            return OrbitType.NearParabolic;
        }
    } else return OrbitType.Hyperbolic;
}

export function mapOrbitElements(dEl:OrbitDataElements):OrbitElements {
    const el = {
        id: dEl.id,
        fulldesignation: dEl.fulldesignation,
        N: dEl.node,
        a: dEl.a,
        e: dEl.e,
        name: dEl.Name,
        G: dEl.G,
        i: dEl.incl,
        H: dEl.H,
        w: dEl.peri,
        M: dEl.M,
        n: dEl.n,
        q: dEl.q,
        Tp: dEl.tperi,
        type: getOrbitType(dEl),
        category: getCategory(dEl)
    }    
    return el;
}

export function getTypeStr(type:OrbitType): string {
    if(type === OrbitType.Elliptical) return 'Elliptical';
    if(type === OrbitType.Parabolic) return 'Parabolic';
    if(type === OrbitType.NearParabolic) return 'NearParabolic';
    return 'Hyperbolic';
}

export function getDataString(dEl:OrbitDataElements):string {
    const type = getOrbitType(dEl);
    return `
        ${dEl.Name}
        Node: ${dEl.Node}
        a: ${dEl.a}
        e: ${dEl.e}
        i: ${dEl.i}
        Peri: ${dEl.Peri}
        M: ${dEl.M}
        n: ${dEl.n}
        Orbit Type: ${getTypeStr(type)}
    `;
}

export const openFileDialog = (accept, callback) => {
	// Create an input element
	var inputElement = document.createElement('input');

	// Set its type to file
	inputElement.type = 'file';

	// Set accept to the file types you want the user to select.
	// Include both the file extension and the mime type
	inputElement.accept = accept;

	// set onchange event to call callback when user has selected file
	inputElement.addEventListener('change', callback);

	// dispatch a click event to open the file dialog
	inputElement.dispatchEvent(new MouseEvent('click'));
};