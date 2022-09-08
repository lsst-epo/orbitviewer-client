const getQuery = require('../../utils/getQuery');
const useCache = require('../../utils/cache.js');


async function getPage() {

  // todo
  // landingLogo, quan arregli lo de les imatges

  const query = `
  {
    entries(section: "customizeOrbits") {
      ...on customizeOrbits_customizeOrbits_Entry {
        customizeOrbitsTitle,
        customizeOrbitsDescription,
        customizeOrbitsButton
      }
    }
  }`;

  const data = await getQuery(query);

  const d = data.data.entries[0];

  const formatted = {
    title: d.customizeOrbitsTitle,
    description: d.customizeOrbitsDescription,
    button: d.customizeOrbitsButton
  }

  return formatted;
}


// export for 11ty
// module.exports = getPage;
module.exports = async () => {
  return useCache(getPage, 'customizeOrbits.json');
}