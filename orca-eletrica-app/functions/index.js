const { onRequest } = require("firebase-functions/v2/https"); // <- Aqui o espaço é aceitável, é desestruturação
const logger = require("firebase-functions/logger");

exports.minhaPrimeiraFuncaoHTTP = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true }); // <- Aqui está o erro: { structuredData: true }
  response.send("Olá do Firebase! Esta é sua primeira função HTTP v2.");
});