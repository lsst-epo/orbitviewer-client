const getQuery = require('../../utils/getQuery');


async function getLanding() {
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

  return data;
}


// export for 11ty
module.exports = getLanding;