function main(
  datasetId = 'bigquery-public-data.covid19_open_data',
  tableId = 'my_table',
  bucketName = 'my-bucket',
  filename = 'file.json'
) {
  // [START bigquery_extract_table_json]
  // Import the Google Cloud client libraries
  const {BigQuery} = require('@google-cloud/bigquery');
  const {Storage} = require('@google-cloud/storage');

  const bigquery = new BigQuery();
  const storage = new Storage();

  async function extractTableJSON() {

    // Location must match that of the source table.
    const options = {
      format: 'json',
      location: 'US',
    };

    // Export data from the table into a Google Cloud Storage file
    const [job] = await bigquery
      .dataset(datasetId)
      .table(tableId)
      .extract(storage.bucket(bucketName).file(filename), options);

    console.log(`Job ${job.id} created.`);

    // Check the job's status for errors
    const errors = job.status.errors;
    if (errors && errors.length > 0) {
      throw errors;
    }
  }
  // [END bigquery_extract_table_json]
  extractTableJSON();
}

main(...process.argv.slice(2));
