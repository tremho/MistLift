/* eslint @typescript-eslint/no-var-requires: "off" */
import path from 'path'

import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'

import express from 'express'
import { gatherFunctionDefinitions } from '../lib/openAPI/ApiBuildCollector'
import { buildOpenApi } from '../lib/openAPI/openApiConstruction'
import {BadRequest, Log} from '@tremho/inverse-y'

const clearModule = require('clear-module')
const router = express.Router()
router.use(express.raw({ type: '*/*', limit: '6mb' }))

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

        const callHandler = (def: any, req: any, res: any): void => {
          if(!isRouteValid(def, req)) {
            return handleResponse(res, {statusCode:403, body:'Invalid route'})
          }
          const event = requestToEvent(def, req)
          Promise.resolve(start(event, null, null)).then(respOut => {
            handleResponse(res, respOut)
          }).catch<any>((reason: any) => undefined)
        }

        if (method === 'get') {
          router.get(entryRoot, (req, res) => callHandler(def, req, res))
        } else if (method === 'post') {
          router.post(entryRoot, (req, res) => callHandler(def, req, res))
        } else if (method === 'put') {
          router.put(entryRoot, (req, res) => callHandler(def, req, res))
        } else if (method === 'patch') {
          router.patch(entryRoot, (req, res) => callHandler(def, req, res))
        } else if (method === 'delete') {
          router.delete(entryRoot, (req, res) => callHandler(def, req, res))
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

// compare request route to the definition of this function to see if it matches
function isRouteValid(def:any, req:any) {
  console.log("---- isRouteValid checks ----")
  let path = req.path
  let pathMap = def.pathMap
  if(path.endsWith('/')) path = path.substring(0, path.length-1)
  if(pathMap.endsWith('/')) pathMap = pathMap.substring(0,path.length-1)
  console.log("definition is "+pathMap)
  console.log("path is "+path)
  const defParts = pathMap.split('/')
  const pathParts = path.split('/')
  console.log("defParts", defParts)
  console.log("pathParts", pathParts)

  // No optional parameters -- we have to pass 'undefined' or '~' for unused path values, or use querystring parameters
  // let firstOptional = 0
  // for(let p of defParts) {
  //   ++firstOptional
  //   if(p.startsWith('{') && p.endsWith('}')) {
  //     p = p.substring(1, p.length-1).trim()
  //     if(p.endsWith('?')) break;
  //   }
  // }
  // console.log('firstOptional = '+firstOptional)
  // console.log("pathParts.length = "+pathParts.length)
  // let valid = pathParts.length <= firstOptional
  let valid = pathParts.length == defParts.length
  console.log("--------------")
  return valid
}

// returns 'text', 'json', or undefined
function bodyTypeCollapse (type: string) {
  const options: any = {
    text: 'text',
    json: 'json',
    'application/json': 'json'
  }
  if (type) {
    type = type.toLowerCase().trim()
    if (type.substring(0, 5) === 'text/') return 'text'
    return options[type]
  }
}

function requestToEvent (def: any, req: any): any {
  console.warn('requestToEvent (express)... body is type ', typeof (req.body))
  // lets assume template says the type
  const type = bodyTypeCollapse(def.bodyType)
  if (type === 'text') {
    if(typeof req.body === 'object') {
      if(Buffer.isBuffer(req.body)) {
        req.body = req.body.toString()
      } else {
        req.body = JSON.stringify(req.body)
      }
    }
  }
  else if (type === 'json') {
    if(typeof req.body === 'object') {
      if(Buffer.isBuffer(req.body)) {
        req.body = req.body.toString()
      }
    }
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body)
      } catch (e: any) {
        console.error(ac.bold.red('Failed request body JSON parse'))
      }
    }
  } else {
    // binary expects a buffer
    if(typeof req.body === 'object') {
      req.body = JSON.stringify(req.body) // make a string first before we bufferize the json
    }
    req.body = Buffer.from(req.body)
  }
  const template = def.pathMap

  // unpack weird choice of express when passed from curl.
  if (typeof (req.body) === 'object') {
    const bprops = Object.getOwnPropertyNames(req.body)
    if (bprops.length === 1) {
      try {
        req.body = JSON.parse(bprops[0])
      } catch (e: any) {
        console.error(ac.bold.red('Failed request body JSON parse '), '(curl)')
      }
    }
  }

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
      let pn = brknm.substring(1, brknm.length - 1)
      let pv:string|undefined =  (pslots[i] ?? '').trim()
      if(pv === 'undefined' || pv === '~') pv = undefined
      parameters[pn] = pv
    }
  }
  for (const p of Object.getOwnPropertyNames(req.query)) {
    parameters[p] = req.query[p]
  }
  // const headers = req.headers
  // console.warn(">>> functionBinder geting headers", {req, headers})
  // const apiKey = req.header('x-api-key')
  // console.warn(">>> apiKey returned using header function", {apiKey})
  // console.log('making eventOut with req.body=', req.body)
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
