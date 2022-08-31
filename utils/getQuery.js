const token = 'LdTQ3Q1QUtzPec_TNIAmmolWYUaevo3o'; // Todo moure a un env

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
		const queryFetch = await fetch("http://localhost:8080/api", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${token}`,
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