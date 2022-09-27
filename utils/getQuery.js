
// Localhost
require('dotenv').config();

const env = process.env.ELEVENTY_ENV ? process.env.ELEVENTY_ENV.split(':') : [];
const isLocalhost = env.indexOf('localhost') > -1;

const url = isLocalhost ? 'http://localhost:8080' : 'https://orbitviewer-api-dot-skyviewer.uw.r.appspot.com';

// Real deal
const fetch = (...args) =>
import('node-fetch').then(({ default: fetch }) => fetch(...args));


async function getQuery(query = null) {

	if(query === null){
		throw new Error();
 	}

  // content array
  let content = [];

	try {
		// initiate fetch
		const queryFetch = await fetch(`${url}/api`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${isLocalhost ? process.env.LOCAL_TOKEN : process.env.PROD_TOKEN}`,
			},
			body: JSON.stringify({
				query,
			}),
		});

		// store the JSON response when promise resolves
		content = await queryFetch.json();

	} catch (error) {
		throw new Error(error);
	}
  
  return content;
}

module.exports = getQuery;