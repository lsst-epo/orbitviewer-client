import { CoreApp } from "../../common/core/CoreApp";
import { DEV } from "../../common/core/Globals";
import { historyInit, LOCATION, onChange } from "../pagination/History";
import { PAGES } from "../pagination/PagesRecap";
import { inputs } from "../ui/inputs/InputsManager";
import { panels, panelsAddListeners } from "../ui/panels/PanelsManager";
import { setDeviceHeight, setDeviceType, setWindowRatioMode } from "../utils/Helpers";

export class ProductionApp extends CoreApp {

    constructor() {
        super();
        if(DEV) console.log('Production App running');

        historyInit();

        this.resize();
    }


    resize(width: number = window.innerWidth, height: number = window.innerHeight): void {
        super.resize(width, height);
        setDeviceHeight();
        setDeviceType();
        setWindowRatioMode();
        for(const page of PAGES) page.class.onResize();
        for(const panel of panels) panel.onResize();
    }

    onDataLoaded(): void {
        super.onDataLoaded();

        panelsAddListeners();
        
        window.addEventListener('popstate', (e) => {
            LOCATION.popstate = true;
            e.preventDefault();
            onChange();
        });
     
    }


    update(): void {
        super.update();

        for(const page of PAGES) page.class.update();
        for(const input of inputs) input.input.update();
        for(const panel of panels) panel.update();

    }
}