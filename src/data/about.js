const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');

async function getPage() {
  const query = `
  {
    entries(section: "about") {
			...on about_about_Entry {
				menuTitle 
				menuSubtitle
				text
        localized {
          ... on about_about_Entry {
              menuTitle
              menuSubtitle
              text
          }
        }
			}
		}
  }`;

  const data = await getQuery(query);

  const d = data.data.entries[0];
  
  const formatted = {
    title: d.menuTitle,
		description: d.menuSubtitle,
		content: d.text
  }

  return formatted;
}


// export for 11ty
// module.exports = getPage;

module.exports = async () => {
  return useCache(getPage, 'about.json');
}