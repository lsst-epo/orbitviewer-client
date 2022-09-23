const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {

  const data = {};

  const content = `
    ...on about_about_Entry {
      text
    }
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      entries(section: "about", siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);
    data[i === 1 ? 'en' : 'es'] = d.data.entries[0];

  }

  return data;
}


module.exports = async () => {
  return useCache(getPage, 'about.json');
}