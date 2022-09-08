const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');


async function getPage() {

  // todo
  // landingLogo, quan arregli lo de les imatges

  const query = `
  {
    entries(section: "landing") {
      ...on landing_landing_Entry {
        landingCenterTitle,
        landingVersion,
        landingLeftButtonText,
        landingRightButtonText
      }
    }
  }`;

  const data = await getQuery(query);

  const d = data.data.entries[0];

  const formatted = {
    title: d.landingCenterTitle,
    version: d.landingVersion,
    leftButton: d.landingLeftButtonText,
    rightButton: d.landingRightButtonText
  }

  return formatted;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'landing.json');
}