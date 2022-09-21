const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');



async function getPage() {

  const data = {};

  const content = `
    ... on guidedExperiencesTours_default_Entry {
					title,
					slug,
					tourPicker {
						title,
						slug
					},
					complexity,
					flexible {
						... on flexible_introSlide_BlockType {
								typeHandle
								slideTitle
								subTitle
								slideContent
								thumbnail
						}
						... on flexible_defaultSlide_BlockType {
								typeHandle
								slideTitle
								subTitle
								slideContent
						}
						... on flexible_funFactSlide_BlockType {
								typeHandle
								slideContent
						}
					}
				}
  `;

  for(let i = 1; i <= 2; i++){
    const query = `
    {
      entries(section: "guidedExperiencesTours", siteId: "${i}") {
        ${content}
      }
    }`;

    const d = await getQuery(query);
    data[i === 1 ? 'en' : 'es'] = d.data.entries;

  }

	console.log(data.en[0].tourPicker);
  return data;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'guidedExperiencesTours.json');
}