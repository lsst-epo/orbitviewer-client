const getQuery = require('../../utils/getQuery');


async function getPage() {

  // todo
  // landingLogo, quan arregli lo de les imatges

  const query = `
  {
    categories(group: "objectTypes") {
			title,
			slug
		}
  }`;

  const data = await getQuery(query);

  const d = data.data.categories;
	console.log(data.data.categories);

	return d;
}


// export for 11ty
module.exports = getPage;