const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

exports.minhaPrimeiraFuncaoHTTP = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Olá do Firebase! Esta é sua primeira função HTTP v2.");
});

