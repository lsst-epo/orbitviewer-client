import { Vector2 } from "three";

export class ExpandableItem {
	dom: HTMLElement;

	id: string;

	active: boolean = false;

	position: Vector2 = new Vector2();
	constructor(dom){
		
		this.dom = dom.cloneNode(true);
		dom.remove();

		this.id = this.dom.getAttribute('data-id');
				
	}
}