const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {

  const data = {};

  const content = `
    ... on elements_default_Entry {
				title
        elementID
        elementContextInformation
				elementCategory {
					slug
				}					
		}
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      entries(section: "elements", siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);
    data[i === 1 ? 'en' : 'es'] = d.data.entries;

  }
  return data;
}



// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'solarSystemElements.json');
}