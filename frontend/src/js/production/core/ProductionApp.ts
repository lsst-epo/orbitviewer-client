import { CoreApp } from "../../common/core/CoreApp";
import { getEntryById } from "../../common/data/DataManager";
import { historyInit, LOCATION, onChange, PAGES } from "../pagination/History";
import { initExpandableItems } from "../ui/expandable-items/ExpandableItems";

export class ProductionApp extends CoreApp {
    rotSpeed:number = .1;

    constructor() {
        super();
        console.log('Production App running');

        historyInit();

    }

    onDataLoaded(): void {
        super.onDataLoaded();
        
        const demo = getEntryById('globals').data['demo'];
        this.rotSpeed = demo['rotSpeed'];

        window.addEventListener('popstate', (e) => {
            LOCATION.popstate = true;
            e.preventDefault();
            onChange();
        })

        initExpandableItems();
    }

    update(): void {
        super.update();

        for(const page of PAGES) page.class.update();

        this.mesh.rotation.z = this.clock.getElapsedTime() * this.rotSpeed;

    }
}