/* eslint @typescript-eslint/no-var-requires: "off" */
import path from 'path'

import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'

import express from 'express'
import { gatherFunctionDefinitions } from '../lib/openAPI/ApiBuildCollector'
import { buildOpenApi } from '../lib/openAPI/openApiConstruction'
import { Log } from '@tremho/inverse-y'

const clearModule = require('clear-module')
const router = express.Router()

export function functionBinder (): void {
  const defs = gatherFunctionDefinitions()
  buildOpenApi(defs).then(() => { // creates apidoc.yaml for when /api is run
    const projectPaths = resolvePaths()

    for (const def of defs) {
      const name: string = def.name
      const pathMap: string = def.pathMap
      let method: string = def.method
      let rpath = ''
      try {
        if (method === undefined) {
          const nstr: string = name?.toString() ?? ''
          console.log(ac.red(`no method defined for ${nstr}`))
          if (def.allowedMethods !== undefined) {
            console.log(ac.bgBlack.yellowBright('DEPRECATED') + ac.blue(' As of v1.1.8, The use of ') + ac.black.italic('allowedMethods') + ac.blue(' is replaced by the single' +
                ac.black.italic(' method ') + ac.blue('property.') + ac.black.bold('Please update your definition file')))
            method = def.allowedMethods.split(',')[0]
          }
        }

        method = method.trim().toLowerCase()
        rpath = path.join(projectPaths.buildPath, 'functions', name, 'src', 'main.js')
        console.warn('loading function', name)
        clearModule(rpath)
        const { start } = require(rpath)

        let entryRoot: string = pathMap
        const n = entryRoot.indexOf('/{')
        if (n !== -1) entryRoot = entryRoot.substring(0, n) + '/*'

        const callHandler = (pathMap: string, req: any, res: any): void => {
          const event = requestToEvent(pathMap, req)
          Promise.resolve(start(event, null, null)).then(respOut => {
            handleResponse(res, respOut)
          }).catch<any>((reason: any) => undefined)
        }

        if (method === 'get') {
          router.get(entryRoot, (req, res) => callHandler(pathMap, req, res))
        } else if (method === 'post') {
          router.post(entryRoot, (req, res) => callHandler(pathMap, req, res))
        } else if (method === 'put') {
          router.put(entryRoot, (req, res) => callHandler(pathMap, req, res))
        } else if (method === 'patch') {
          router.patch(entryRoot, (req, res) => callHandler(pathMap, req, res))
        } else if (method === 'delete') {
          router.delete(entryRoot, (req, res) => callHandler(pathMap, req, res))
        } else {
          console.log(ac.red.bold('Cannot map method ') + ac.blue.bold(method))
        }
      } catch (e: any) {
        // Log.Error(ac.bold.red(e.message.split('\n')[0]))0
        // throw new Error("Unable to load and bind function code at "+ rpath)
        Log.Error('Unable load and bind function code', rpath)
        Log.Exception(e)
      }
    }
  }).catch<any>((reason: any) => undefined)
}

function requestToEvent (template: string, req: any): any {
  let path: string = req.originalUrl ?? ''
  const qi = path.indexOf('?')
  if (qi !== -1) path = path.substring(0, qi)
  const ptci: number = path.indexOf('://') + 3
  const ei: number = path.indexOf('/', ptci)
  let host: string = path.substring(0, ei)
  if (ptci < 3) {
    host = req.headers?.host ?? req.headers?.origin ?? req.headers?.referer ?? ''
    if (!host.startsWith('http')) {
      if (!host.startsWith('https')) {
        host = 'http://' + host
      }
    }
  }
  const cookies: any = {}
  const cookieString = req.headers?.cookie ?? ''
  const crumbs = cookieString.split(';')
  for (const c of crumbs) {
    const pair: string[] = c.split('=')
    if (pair.length === 2) cookies[pair[0]] = pair[1]
  }
  const parameters: any = {}
  const tslots = template.split('/')
  const pslots = path.split('/')
  for (let i = 0; i < tslots.length; i++) {
    const brknm = (tslots[i] ?? '').trim()
    if (brknm.charAt(0) === '{') {
      const pn = brknm.substring(1, brknm.length - 1)
      parameters[pn] = (pslots[i] ?? '').trim()
    }
  }
  for (const p of Object.getOwnPropertyNames(req.query)) {
    parameters[p] = req.query[p]
  }
  const headers = req.headers
  // console.warn(">>> functionBinder geting headers", {req, headers})
  // const apiKey = req.header('x-api-key')
  // console.warn(">>> apiKey returned using header function", {apiKey})
  const eventOut: any = {
    requestContext: req,
    request: {
      originalUrl: host + (req.originalUrl as string),
      headers: req.headers
    },
    body: req.body,
    cookies,
    parameters
  }
  return eventOut
}
function handleResponse (res: any, resp: any): void {
  // console.log(">>>>>>>> Handling response >>>>>>>>>")

  if (resp !== undefined) {
    if (resp.cookies !== undefined) {
      // console.log("--- see cookies", resp.cookies)
      let cookies: any = []
      if (Array.isArray(resp.cookies)) {
        cookies = resp.cookies
      } else {
        const age: number = resp.cookies.expireSeconds ?? 60 // 1 minute
        delete resp.expireSeconds
        Object.getOwnPropertyNames(resp.cookies).forEach(name => {
          const value: string = resp.cookies[name]
          cookies.push(`${name}=${value}; Max-Age=${age}; `)
        })
      }
      // console.log("cookies being set", cookies)
      res.setHeader('set-cookie', cookies)
      delete resp.cookies
    }
    if (resp.headers !== undefined) {
      // if (resp.statusCode === 301) ClogTrace("Redirecting...");
      for (const hdr of Object.getOwnPropertyNames(resp.headers)) {
        // ClogTrace("Setting header ", hdr, resp.headers[hdr]);
        res.setHeader(hdr, resp.headers[hdr])
      }
      delete resp.headers
      // console.log("past setting headers");
    }
    if (resp.statusCode !== undefined) {
      res.statusCode = resp.statusCode
      delete resp.statusCode
    }

    if (resp.contentType !== undefined) {
      res.setHeader('Content-Type', resp.contentType)
      delete resp.contentType
    }
    if (resp.body !== undefined) resp = resp.body
  }
  // console.log("headers to be sent", res.getHeaders())
  // console.log("-- Sending response", resp)
  res.send(resp)
}

export default router
