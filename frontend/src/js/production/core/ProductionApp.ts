import { CoreApp } from "../../common/core/CoreApp";
import { getEntryById } from "../../common/data/DataManager";
import { historyInit } from "../pagination/History";

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
    }

    update(): void {
        super.update();

        this.mesh.rotation.z = this.clock.getElapsedTime() * this.rotSpeed;
    }
}