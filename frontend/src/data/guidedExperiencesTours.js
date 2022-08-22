const getQuery = require('../../utils/getQuery');


async function getPage() {

	// todo
	// landingLogo, quan arregli lo de les imatges

	const query = `
	{
		entries(section: "guidedExperiencesTours") {
			... on guidedExperiencesTours_default_Entry {
				title
				slug
			}
		}
	}`;

	const data = await getQuery(query);

	const d = data.data.entries;

	return d;
}


// export for 11ty
module.exports = getPage;