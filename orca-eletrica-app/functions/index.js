// functions/index.js

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Esta é uma função HTTP de exemplo.
// Você pode acessá-la em uma URL como:
// https://SEU_REGION-SEU_PROJECT_ID.cloudfunctions.net/minhaPrimeiraFuncaoHTTP
exports.minhaPrimeiraFuncaoHTTP = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Olá do Firebase! Esta é sua primeira função HTTP v2.");
});