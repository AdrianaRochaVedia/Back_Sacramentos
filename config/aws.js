const { S3Client } = require('@aws-sdk/client-s3');
const { TextractClient } = require('@aws-sdk/client-textract');
const { Client } = require('@opensearch-project/opensearch');

const region = process.env.AWS_REGION;

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const textract = new TextractClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// OpenSearch (Con Usuario Maestro)
const opensearch = new Client({
  node: process.env.OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD
  }
});

module.exports = {
  s3,
  textract,
  opensearch
};