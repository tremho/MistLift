/** Run Express Server */
import express from 'express'

import functionRouter, { functionBinder } from '../expressRoutes/functionBinder'

import apiRouter from '../expressRoutes/api'
import allRouter, { allBinder } from '../expressRoutes/all'
import { resolvePaths } from '../lib/pathResolve'

import * as ac from 'ansi-colors'

export function startLocalServer (): void {
  const projectPaths = resolvePaths()
  if (!projectPaths.verified) {
    console.log(ac.bold.red('Cannot start local server'))
    console.log(ac.blue.italic('Not in a valid MistLift project directory'))
    console.log('')
    return
  }
  const port = 8081
  allBinder()
  functionBinder()
  const app = express()
  // for JSON posts
  // app.use(bodyParser.json({limit: '50mb'}))
  app.use(express.json())
  // for form posts
  app.use(express.urlencoded({ extended: true }))

  app.use('/', functionRouter)
  app.use('/api', apiRouter)
  app.use('*', allRouter)

  // =========================================
  // Start server
  // http only
  app.listen(port, function () {
    console.log(`http listening on port ${port}`)
  })
// ================================================
}
