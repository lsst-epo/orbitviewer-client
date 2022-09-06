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

    setDeviceType(){        
        const doc = document.documentElement;
        doc.classList.remove('desktop', 'device');
        
        // 1024 same in media queries
        if(window.innerWidth > 1024) doc.classList.add('desktop');
        else doc.classList.add('device')
    }

    resize(width: number, height: number): void {
        super.resize(width, height);
        this.setDeviceHeight();
        this.setDeviceType();
    }

    onDataLoaded(): void {
        super.onDataLoaded();

        this.setDeviceHeight();
        this.setDeviceType();
        
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