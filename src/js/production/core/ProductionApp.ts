import { CoreApp } from "../../common/core/CoreApp";
import { historyInit, LOCATION, onChange } from "../pagination/History";
import { PAGES } from "../pagination/PagesRecap";
import { setDeviceHeight, setDeviceType, setWindowRatioMode } from "../utils/Helpers";

export class ProductionApp extends CoreApp {

    constructor() {
        super();
        console.log('Production App running');

        historyInit();

        this.resize();
    }


    resize(width: number = window.innerWidth, height: number = window.innerHeight): void {
        super.resize(width, height);
        setDeviceHeight();
        setDeviceType();
        setWindowRatioMode();
        for(const page of PAGES) page.class.onResize();
    }

    onDataLoaded(): void {
        super.onDataLoaded();
        
        // const demo = getEntryById('globals').data['demo'];

        window.addEventListener('popstate', (e) => {
            LOCATION.popstate = true;
            e.preventDefault();
            onChange();
        });
     
      
    }


    update(): void {
        super.update();

        for(const page of PAGES) page.class.update();

    }
}