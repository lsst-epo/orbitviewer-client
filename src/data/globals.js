const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {

  const data = {};

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
				... on share_GlobalSet {
						emailText
						facebookText
						getSnapshotText
						getUrlText
						twitterText
				}
				... on menuTexts_GlobalSet {
						section1Title
						section2Title
						menuTitle
						menuSubtitle
				}
				... on datepickerTabTexts_GlobalSet {
						datepickerGoToDate
						datePickerDescription
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
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      globalSets(siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);

		const formatted = {};
		for(const subItem of d.data.globalSets){

			for(const key in subItem){
				formatted[key] = subItem[key];
			}
		}

    data[i === 1 ? 'en' : 'es'] = formatted;

  }

	return data;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'globals.json');
}