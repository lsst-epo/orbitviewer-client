

const fetch = require('node-fetch');

const token = "mklNxBQSfDf69uUoOWvtyVK4P6pe9h7r";

async function getContent() {

  const recordsPerQuery = 100;

  // number of records to skip (start at 0)
  let recordsToSkip = 0;

  // do we make a query ?
  let makeNewQuery = true;

  // Blogposts array
  let blogposts = [];

}

// query MyQuery {
//   entries(section: "about") {
//     ...on about_about_Entry {
//       siteTitle
//       siteDescription
//       pageContent
//     }
//   }
// }
// Authorization: Bearer mklNxBQSfDf69uUoOWvtyVK4P6pe9h7r