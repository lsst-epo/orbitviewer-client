const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {

  const data = {};

	const contentOrder = [
		'seo',
		'common',
		'menu',
		'filters',
		'share',
		'datepicker',
		'search'
	]

  const content = `
    ... on defaultSEO_GlobalSet {
						seoTitle
						seoDescription
						seoImage {
								... on cantoDam_Asset {
										url
								}
						}
		}
		... on commonStrings_GlobalSet {
				commonApply
				commonCancel
				commonFar
				commonFilter
				commonFuture
				commonNear
				commonPast
				commonReset
				commonedit
		}
		... on mainMenu_GlobalSet {
				section1Title
				section2Title
				menuTitle
				menuSubtitle
		}
		... on sharePanel_GlobalSet {
				emailText
				facebookText
				getSnapshotText
				getUrlText
				twitterText
		}
		... on filtersPanel_GlobalSet {
				section1Title
				section2Title
				menuTitle
				menuSubtitle
				applyFilter
				resetFilter
		}
		... on datepickerPanel_GlobalSet {
				datepickerGoToDate
				datepickerDescription
		}
		... on searchPanel_GlobalSet {
				showRandomObjectButton
				searchPlaceholder
		}
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      globalSets(siteId: "${i}") {
        ${content}
      }
    }`;

    let d = await getQuery(query);
		d = d.data.globalSets;

		const formatted = {};
		for(const subItem in d){

			for(const key in d[subItem]){
				if(!!!formatted[contentOrder[subItem]]) formatted[contentOrder[subItem]] = {};
				formatted[contentOrder[subItem]][key] = d[subItem][key];
			}
		}

    data[i === 1 ? 'en' : 'es'] = formatted;

  }

	console.log(data);

	return data;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'globals.json');
}