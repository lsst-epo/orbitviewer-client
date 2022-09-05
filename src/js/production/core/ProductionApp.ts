import { CoreApp } from "../../common/core/CoreApp";
import { historyInit, LOCATION, onChange, PAGES } from "../pagination/History";

export class ProductionApp extends CoreApp {

    constructor() {
        super();
        console.log('Production App running');

        historyInit();

    }

    setDeviceHeight(){        
        const doc = document.documentElement
        doc.style.setProperty('--doc-height', `${window.innerHeight}px`)
    }

    resize(width: number, height: number): void {
        super.resize(width, height);
        this.setDeviceHeight();
    }

    onDataLoaded(): void {
        super.onDataLoaded();

        this.setDeviceHeight();
        
        // const demo = getEntryById('globals').data['demo'];

        window.addEventListener('popstate', (e) => {
            LOCATION.popstate = true;
            e.preventDefault();
            onChange();
        })

    }

    update(): void {
        super.update();

        for(const page of PAGES) page.class.update();

    }
}