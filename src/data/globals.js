const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {

  const data = {};

	const contentOrder = [
		'seo',
		'menu'
	]

  const content = `
    ... on defaultSEO_GlobalSet {
			seoSiteName
			seoTitle
			seoDescription
			seoImage {
				url(quality: 95, width: 500)
			}
		}
		... on mainMenu_GlobalSet {
			helpUrl
			howToUseUrl
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
	return data;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'globals.json');
}