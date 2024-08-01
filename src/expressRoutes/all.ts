import path from 'path'
import fs from 'fs'

import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'
import { gatherFunctionDefinitions } from '../lib/openAPI/ApiBuildCollector'

import express from 'express'
const router = express.Router()

export function allBinder (): void {
  const projectPaths = resolvePaths()
  const defs = gatherFunctionDefinitions()

  /**
     * @name /all
     * @description
     * Catch-all handler for URLs
     * Provides some simple spam blocking and checks for file pass through at file root.
     *
     * ##### Filtering:
     * - all .php extension references
     *
     * ##### File root:
     * - file root is at service root + 'Public'
     * - no path or path ending in / is appended with '/index.html' for folder root default behavior
     * - File contents passed through using `sendFile` (will handle its own 404 if not found)
     *
     */
  router.all('*', (req, res, next) => {
    // any PHP requests should be ignored
    if (req.originalUrl.includes('.php')) {
      return res.send('')
    }
    if (req.originalUrl.includes('.env')) {
      return res.send('')
    }
    if(req.originalUrl.endsWith('webroot/favicon.ico')) {
      return res.send('')
    }

    let filepath = req.originalUrl ?? '/'
    // match cloud behavior for docs because /api doesn't change cwd there
    if (filepath.substring(0, 10) === '/api/docs/') {
      filepath = filepath.replace('/api', '')
    }
    let funcFound = filepath === '/api' // reserved "function"
    if (!funcFound) {
      if (filepath.charAt(0) === '/') {
        let n = filepath.indexOf('/', 1)
        if (n === -1) n = filepath.length
        let rootEntity = filepath.substring(0, n)
        n = rootEntity.indexOf('?')
        if (n === -1) n = rootEntity.length
        rootEntity = rootEntity.substring(0, n)
        for (const entry of defs) {
          let entryRoot = entry.pathMap
          const n = entryRoot.indexOf('/{')
          if (n !== -1) entryRoot = entryRoot.substring(0, n)
          if (rootEntity === entryRoot) {
            funcFound = true
            break
          }
        }
      }
    }

    if (!funcFound) {
      // check for '/' in path beyond the first one
      if (filepath.includes('/', 1)) {
        // console.log(ac.magenta.italic("Warning: / path delimiters will not be honored in a cloud deployment, use + instead ")+filepath)
      }
      // convert any incoming + to / to match cloud behavior
      while (filepath.includes('+')) filepath = filepath.replace('+', '/')

      // Put any other filtering here
      if (filepath.includes('?')) {
        filepath = filepath.substring(0, filepath.indexOf('?'))
      }
      if (filepath.substring(filepath.length - 1) === '/') filepath += 'index.html'
      if (filepath.substring(0, 10) === '/api/docs/') {
        filepath = filepath.replace('/api', '')
      }
      if (filepath.includes('/docs')) {
        if (filepath.includes('.map')) {
          return res.sendStatus(200)
        }
      }
      if (!filepath.endsWith('.websocket')) {
        filepath = path.resolve(path.join(projectPaths.basePath, 'webroot', filepath)) // .. out of build
        if (fs.existsSync(filepath)) {
          return res.sendFile(filepath)
        } else {
          console.log(ac.red.bold("can't find " + filepath))
          return res.sendStatus(404)
        }
      }
    }
    // if none of the above, tickle enumerator so we can process other paths
    next()
  })
}
export default router
