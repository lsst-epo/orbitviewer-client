import { CoreApp } from "../../common/core/CoreApp";
import { getEntryById } from "../../common/data/DataManager";
import { Log } from "../ui/helpers/Log";
import { menuManager } from "../ui/menu/menuManager";
import { GlobalSettings } from "../ui/sets/GlobalSettings";
import { resetUiSets, uiSets } from "../ui/uiManager";

export class EditorApp extends CoreApp {
    globals:GlobalSettings;

    constructor() {
        super();
    }

    launch(): void {
        super.launch();

        const globalsButton = document.querySelector('#globals') as HTMLElement;

        this.globals = new GlobalSettings("globals", {
            onChange: () => {
                
            }
        });

        // To-Do: Update to something that makes sense.
        this.globals.import(getEntryById('globals').data['demo']);
        menuManager.add(globalsButton, this.globals);
        uiSets.push(this.globals);

        // Some uiSets got updated while loading, this resets the 'updated' attr so those won't get saved unless something new changes
        resetUiSets();

        menuManager.addEventListeners();

        Log.message('Launched Editor App', true);
    }
}