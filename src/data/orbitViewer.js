const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {

  const data = {};

  const content = `
    ...on orbitViewer_orbitViewer_Entry {
      seoTitle
      seoDescription
      seoImage {
        url(quality: 95, width: 500)
      }
    }
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      entries(section: "orbitViewer", siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);
    data[i === 1 ? 'en' : 'es'] = d.data.entries[0];

  }

	return data;
}


module.exports = async () => {
  return useCache(getPage, 'orbitViewer.json');
}