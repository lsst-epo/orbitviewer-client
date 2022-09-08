const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {
  const query = `
  {
    entries(section: "about") {
			...on about_about_Entry {
				siteTitle
				siteDescription
				pageContent
			}
		}
  }`;

  const data = await getQuery(query);

  const d = data.data.entries[0];
  
  const formatted = {
    title: d.siteTitle,
		description: d.siteDescription,
		content: d.pageContent
  }

  return formatted;
}


// export for 11ty
// module.exports = getPage;

module.exports = async () => {
  return useCache(getPage, 'about.json');
}