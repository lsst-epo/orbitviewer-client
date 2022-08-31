import { Log } from "../ui/helpers/Log";
import { resetUiSets, uiSets } from "../ui/uiManager";
import { SaveJSON } from "../utils/FileUploader";
import { capitalize } from "../utils/strings";

export const saveSet = (set:uiSet) => {
	const saveOk = SaveJSON(set.id, set.export());
	logResult(saveOk, `${set.id} JSON`);
}

export const saveData = () => {
	for (const set of uiSets) {
		if(!set.updated) continue;
		const saveOK = saveSet(set);
        // logResult(saveOK);
	}

	resetUiSets();
};

const logResult = (success, dataType: string = 'Data') => {
	const str = capitalize(dataType);
	const msg = success ? `${str} saved` : `${str} not saved`;
	if (success) Log.log(msg, true);
	else Log.error(msg, true);
};