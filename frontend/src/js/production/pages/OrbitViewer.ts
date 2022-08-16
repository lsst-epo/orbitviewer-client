import { Panels } from "../ui/Panel";
import { Search } from "../ui/Search";
import { Page } from "./Page";


export class OrbitViewer extends Page {
	load(resolve: any): void {
	
		new Search(this.dom);

		super.load(resolve)
	}
}