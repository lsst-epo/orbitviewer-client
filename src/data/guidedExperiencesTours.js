const getQuery = require('../../utils/getQuery');


async function getPage() {

	// todo
	// landingLogo, quan arregli lo de les imatges

	const query = `
	{
		entries(section: "guidedExperiencesTours") {
			... on guidedExperiencesTours_default_Entry {
				title,
				slug,
				tourPicker {
					title,
					slug
				},
				comingSoon,
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
		}
	}`;

	const data = await getQuery(query);
	const d = data.data.entries;
	return d;
}


// export for 11ty
module.exports = getPage;