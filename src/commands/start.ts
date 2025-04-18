/** Run Express Server */
import express from 'express'

import watch from 'node-watch'
import expressWS from 'express-ws'

import functionRouter, { functionBinder } from '../expressRoutes/functionBinder'

import apiRouter from '../expressRoutes/api'
import allRouter, { allBinder } from '../expressRoutes/all'
import { resolvePaths } from '../lib/pathResolve'
import { esbuilder, readServerConfig } from '../lib/ESBuild'
import { doBuildAsync } from './build'

import * as ac from 'ansi-colors'

import path from 'path'
import bodyParser from 'body-parser'

const defaultPort = 8081
const serverConfig = readServerConfig()
let server: any = null
const app = express()

export async function startLocalServer (): Promise<void> {
  console.warn('startLocalServer')
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
  // app.use(express.raw({limit: '6mb'}))
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(express.json({ limit: '6mb' }))
  // for form posts
  app.use(express.urlencoded({ extended: true }))

  app.use('/', functionRouter)
  app.use('/api', apiRouter)
  app.use('*', allRouter)

  startServers()

  void funcWatcher(path.join(projectPaths.basePath, 'functions'), path.join(projectPaths.basePath, 'webroot'))
  // sleep(5000).then(() => esbuilder())
  void esbuilder(triggerRebuild, false)
}
function startServers (): void {
  startWebSocketConnection(app)
  server = app.listen(serverConfig.port, function () {
    const port: number = serverConfig?.port ?? defaultPort
    console.log(`http listening on port ${port}`)
  })
}

async function funcWatcher (watchPath: string, webrootPath: string): Promise<void> {
  if (serverConfig.rebuildFunctionsOnChange !== true) return
  // console.log('watching for changes in functions')
  watch(watchPath, { recursive: true }, onWatch1)

  if (serverConfig.refreshBrowserOnWebrootChange === true) {
    // console.log('watching for webroot changes')
    watch(webrootPath, { recursive: true }, onWatch2)
  }
}
function onWatch1 (evt: string, name: string): void {
  // console.log("funcWatch Event seen", {evt, name})
  void triggerRebuild()
}
function onWatch2 (evt: string, name: string): void {
  console.log('Webroot Watch Event seen', { evt, name })
  void triggerBrowserRestart()
}

let alreadyBuilding = false
async function triggerRebuild (): Promise<void> {
  if (!alreadyBuilding) {
    alreadyBuilding = true
    const errRet: number = await doBuildAsync([])
    if (errRet !== 0) {
      process.exit(errRet)
    }
    alreadyBuilding = false
    if (serverConfig.refreshBrowserOnFunctionChange === true) { void triggerBrowserRestart() }
  }
}

let closing = false

async function triggerBrowserRestart (): Promise<void> {
  if (closing) {
    console.warn('restarting...')
    return
  }
  if (server !== null) {
    closing = true
    await socketClose()
    await server.close()
    // await sleep(1000)
    closing = false
    startServers()
  } else {
    closing = false
  }
}

// class WSConnection {
//   on: any
//   sendUTF: any
//   remoteAddress: string = ''
// }

let socketClose: any = () => {}

function startWebSocketConnection (app: any): void {
  // console.log("Starting WebSocket Connection Listener")
  const ews = expressWS(app)
  const wsapp = ews.app

  socketClose = (e: any) => {
    // console.log("close wss", e)
    ews.getWss().close()
  }

  // wsapp.use((err:any, req:any, res:any, next:any) => {
  //   console.error(err.stack);
  //   res.status(500).send('Something broke!');
  // })

  wsapp.get('/watch', (req: any, res: any, next: any) => {
    // console.log('get route', req.testing)
  })

  wsapp.ws('/watch', (ws: any, req: any) => {
    ws.on('message', (msg: string) => {
      // console.log('Received WS Message: ' + msg)
      ws.send(msg)
    })
    ws.on('close', () => {
      // console.log("Websocket connection closed")
    })
  })
}
