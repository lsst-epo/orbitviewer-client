const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');


async function getPage() {

  // todo
  // landingLogo, quan arregli lo de les imatges

  const query = `
  {
    globalSets {
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
		}
  }`;

  const data = await getQuery(query);

	console.log(data.data.globalSets);

  return data.data.globalSets;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'globals.json');
}