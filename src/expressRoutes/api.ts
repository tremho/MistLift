/* eslint @typescript-eslint/no-var-requires: "off" */
import express from 'express'

import { getProjectName, getProjectVersion } from '../lib/LiftVersion'

const openApiUi = require('openapi-ui')
const router = express.Router()

router.get('/', function (req, res, next) {
  res.send(generateApiDoc())
})

export default router

function generateApiDoc (): void {
  console.log('---- Serving up api')
  return openApiUi.generateIndex({
    baseUrl: 'docs',
    title: `${getProjectName() ?? ''} ${getProjectVersion()?.toString() ?? ''}`,
    url: 'docs/apidoc.yaml'
  })
}
