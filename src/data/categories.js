const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {

  const data = {};

  const content = `
    ... on objectTypes_Category {
      title
      slug
      mainColor
    }
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      categories(group: "objectTypes", siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);

    data[i === 1 ? 'en' : 'es'] = d.data.categories;

  }

  return data;
}

module.exports = async () => {
  return useCache(getPage, 'categories.json');
}