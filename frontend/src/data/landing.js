const getQuery = require('../../utils/getQuery');


async function getLanding() {
  const query = `
  {
    entries(section: "landing") {
      ...on landing_landing_Entry {
        siteTitle
      }
    }
  }`;

  const data = await getQuery(query);

  const d = data.data.entries[0];
  
  const formatted = {
    title: d.siteTitle
  }

  return formatted;
}


// export for 11ty
module.exports = getLanding;