/** Run Express Server */
import express from 'express'

import * as esbuild from 'esbuild'
import watch from 'node-watch';
import expressWS from 'express-ws'

import functionRouter, { functionBinder } from '../expressRoutes/functionBinder'

import apiRouter from '../expressRoutes/api'
import allRouter, { allBinder } from '../expressRoutes/all'
import { resolvePaths } from '../lib/pathResolve'
import { doBuildAsync } from './build'

import * as ac from 'ansi-colors'

import path from 'path'
import fs from 'fs'

import {Log} from "@tremho/inverse-y"

const defaultPort = 8081
const serverConfig = readServerConfig();
let server:any = null
const app = express()

export async function startLocalServer (): Promise<void> {
  // console.warn('startLocalServer')
  const projectPaths = resolvePaths()
  if (!projectPaths.verified) {
    console.log(ac.bold.red('Cannot start local server'))
    console.log(ac.blue.italic('Not in a valid MistLift project directory'))
    console.log('')
    return
  }

  // first build will exit on an error regardless of config
  await doBuildAsync([])
  await allBinder()
  // Log.Trace('calling functionBinder')
  await functionBinder()
  // Log.Trace('done calling functionBinder')
  // for JSON posts
  // app.use(bodyParser.json({limit: '50mb'}))
  app.use(express.json())
  // for form posts
  app.use(express.urlencoded({extended: true}))

  app.use('/', functionRouter)
  app.use('/api', apiRouter)
  app.use('*', allRouter)

  if(!serverConfig.refreshBrowserOnWebrootChange && !serverConfig.rebuildFunctionsOnChange) {
    startServers()
  }

  funcWatcher(path.join(projectPaths.basePath, 'functions'), path.join(projectPaths.basePath, 'webroot'));
  esbuilder();

}
function startServers() {
  startWebSocketConnection(app)
  server = app.listen(serverConfig.port, function () {
    console.log(`http listening on port ${serverConfig.port ?? defaultPort}`)
  })
}

function readServerConfig() {
  // console.log('readServerConfig...')
  const projectPaths = resolvePaths()
  const confFile = path.join(projectPaths.basePath, 'localServerConfig.json')
  if(!fs.existsSync(confFile)) return {}

  const conf:any = JSON.parse(fs.readFileSync(confFile).toString())
  // console.log("server configuration", conf)
  return conf
}

async function esbuilder() {

  if(!serverConfig.esbuild) return;

  const entryPoints = serverConfig.esbuild.entryPoints ?? []
  const outDir = serverConfig.esbuild.outdir ?? 'webroot'
  const watch = serverConfig.esbuild.watch ?? false
  const breakOnError = serverConfig.esbuild.breakOnError ?? false
  const breakOnWarn = serverConfig.esbuild.breakOnWarn ?? false

  let ctx = await esbuild.context({
    entryPoints,
    bundle: true,
    outdir: outDir
  })
  // console.log('esbuild...')

  let result = await ctx.rebuild()
  let more = watch
  do {
    await sleep(500)
    result = await ctx.rebuild()
  } while(more)
}

function sleep(ms:number)
{
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function funcWatcher(watchPath:string, webrootPath:string) {

  if(serverConfig.rebuildFunctionsOnChange !== true) return;
  // console.log('watching for changes in functions')
  watch(watchPath, {recursive:true}, onWatch1)

  if(serverConfig.refreshBrowserOnWebrootChange) {
    // console.log('watching for webroot changes')
    watch(webrootPath, {recursive: true}, onWatch2)
  }
}
function onWatch1(evt:string, name:string) {
  // console.log("funcWatch Event seen", {evt, name})
  triggerRebuild()
}
function onWatch2(evt:string, name:string) {
  // console.log("Webroot Watch Event seen", {evt, name})
  triggerBrowserRestart()
}

let alreadyBuilding = false
async function triggerRebuild() {
  if(!alreadyBuilding) {
    alreadyBuilding = true;
    const errRet = await doBuildAsync([]);
    if(errRet) {
      process.exit(errRet)
    }
    alreadyBuilding = false;
    if(serverConfig.refreshBrowserOnFunctionChange)
      triggerBrowserRestart()
  }
}

function triggerBrowserRestart() {
  // console.log("Trigger Browser Restart")
  if(server) {
    socketClose();
    server.close(() => {
      startServers()
    })
    // console.log("server close initiated")
  } else {
    // console.log("first start of servers")
    startServers()
  }
}

class WSConnection {
  on: any
  sendUTF: any
  remoteAddress:string = ''
}

var socketClose:any = () => {}

function startWebSocketConnection(app:any)
{
  // console.log("Starting WebSocket Connection Listener")
  const ews = expressWS(app)
  const wsapp = ews.app

  socketClose = (e:any) => {
    // console.log("close wss", e)
    ews.getWss().close()
  }


  // wsapp.use((err:any, req:any, res:any, next:any) => {
  //   console.error(err.stack);
  //   res.status(500).send('Something broke!');
  // })

  wsapp.get('/watch', (req:any, res:any, next:any) => {
    // console.log('get route', req.testing)
  })

  wsapp.ws('/watch', (ws:any, req:any) => {
    ws.on('message', (msg:string)=> {
      // console.log('Received WS Message: ' + msg)
      ws.send(msg)
    })
    ws.on('close', () => {
      // console.log("Websocket connection closed")
    })
  })
}
