const path = require('path');
const fs = require('fs-extra');
const fil = `\u001b[1;35m[fil] `;

/**
 * This method returns a cached version if available, else it will get the data via the provided function.
 * @param getData The function that needs to be called when no cached version is available.
 * @param cacheFilename The filename of the file that contains the cached version.
 * @returns the data either from the cache or from the geData function.
 */
module.exports = async function(getData, cacheFilename) {
  // Check if the environment variable is set.
  const env = process.env.ELEVENTY_ENV ? process.env.ELEVENTY_ENV.split(':') : [];
  const isServing = env.indexOf('production') === -1;

  const cacheFilePath = path.resolve(__dirname, '../src/data/_cache/' + cacheFilename);
  let dataInCache = null;

  // Check if the website is being served and that a cached version is available.
  if (isServing && await fs.pathExists(cacheFilePath)) {
    // Read file from cache.
    dataInCache = await fs.readJSON(cacheFilePath);
    console.log(`${fil}Fetch file from cache: ${cacheFilename}`);
  }

  // If no cached version is available, we execute the function.
  if (!dataInCache) {
    const result = await getData();

    // If the website is being served, then we write the data to the cache.
    if (isServing) {
      console.log(`${fil}Save data to cache: ${cacheFilename}`);
      // Write data to cache.
      fs.writeJSON(cacheFilePath, result, err => {
        if (err) {console.error(err)}
      });
    }

    dataInCache = result;
  }

  return dataInCache;
};