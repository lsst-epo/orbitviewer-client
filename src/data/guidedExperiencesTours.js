const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');



async function getPage() {

  const data = {};

  const content = `
    ... on guidedExperiencesTours_default_Entry {
					seoTitle
					seoDescription
					seoImage {
						url(quality: 95, width: 500)
					}
					id
					title
					slug
					tourPicker {
						title
						slug
					}
					tourPreview {
							url(quality: 95, width: 500)
					}
					duration
					complexity
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
								closeUp {
									... on elements_default_Entry {
										elementID
									}
								}
						}
						... on flexible_funFactSlide_BlockType {
								typeHandle
								slideContent
						}
							... on flexible_shareSlide_BlockType {
								typeHandle
								slideTitle
								slideText
								linksTitle
								Link1
								link1Text
								link2
								link2Text
								link3
								link3Text
								link4
								link4Text
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
	return data;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'guidedExperiencesTours.json');
}