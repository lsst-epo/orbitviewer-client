const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');


async function getPage() {

  const data = {};

  const content = `
      title
      slug
      ... on tours_Category {
        tourPreview {
          url(quality: 95, width: 1200)
        }
      }
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      categories(group: "tours", siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);
    data[i === 1 ? 'en' : 'es'] = d.data.categories;

  }

  return data;
}



// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'tours.json');
}