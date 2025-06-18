const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');


async function getPage() {

  const data = {};

  const content = `
    ...on customizeOrbits_customizeOrbits_Entry {
      seoTitle
      seoDescription
      seoImage {
        url(quality: 95, width: 500)
      }
      customizeOrbitsTitle
      customizeOrbitsDescription
    }
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      entries(section: "customizeOrbits", siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);
    data[i === 1 ? 'en' : 'es'] = d.data.entries[0];

  }

  return data;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'customizeOrbits.json');
}