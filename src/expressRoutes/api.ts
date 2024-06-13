import express from 'express'
const router = express.Router();

import {getProjectName, getProjectVersion} from "../lib/LiftVersion";

const openApiUI = require("openapi-ui");


router.get('/', function(req, res, next) {
  res.send(generateApiDoc())
});

export default router

function generateApiDoc()
{
  console.log("---- Serving up api")
  return openApiUI.generateIndex({
    baseUrl: "docs",
    title: `${getProjectName()} ${getProjectVersion()}`,
    url: "docs/apidoc.yaml"
  });

}