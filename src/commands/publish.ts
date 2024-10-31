
import {
  LambdaClient,
  ListFunctionsCommand
} from '@aws-sdk/client-lambda'
import {
  APIGatewayClient,
  ImportRestApiCommand,
  GetRestApisCommand,
  GetResourcesCommand,
  DeleteRestApiCommand,
  PutIntegrationRequest,
  PutIntegrationCommand,
  CreateDeploymentCommand
} from '@aws-sdk/client-api-gateway'

import { getAWSCredentials, getSettings } from '../lib/LiftConfig'

import * as ac from 'ansi-colors'

import path from 'path'
import fs, { mkdirSync } from 'fs'
import os from 'os'
import { resolvePaths } from '../lib/pathResolve'
import { gatherFunctionDefinitions } from '../lib/openAPI/ApiBuildCollector'
import { delay } from '../lib/utils'
import { addBuiltInDefinitions, MakeBuiltinApiDoc } from './builtin/ApiDocMaker'
import { DeployApiBuiltin, DeployRootFileserves, DeployWebrootBuiltIn } from './builtin/BuiltInHandler'
import { esbuilder } from '../lib/ESBuild'
import { getIdSrc, getIdDelimiter } from '../lib/IdSrc'

let projectPaths: any

export async function doPublishAsync (stageName?: string): Promise<number> {
  // let retCode = await doDeployAsync([])
  // if(retCode) return retCode
  const retCode = 0

  projectPaths = resolvePaths()
  if (projectPaths.verified !== true) {
    console.log(ac.bold.magenta('current directory is not at project root'))
    return -1
  }

  await publishApi(stageName ?? 'Dev')

  return retCode
}

async function publishApi (
  stageName?: string
): Promise<void> {
  if (stageName === undefined) stageName = 'Dev'
  console.log(ac.green.bold(`Publishing Api to ${stageName}`))

  // console.log(ac.gray.dim('>> esbuilder '))
  await esbuilder(null, true)
  // do the built-in deploys
  // console.log(ac.gray.dim('>> webroot '))
  await DeployWebrootBuiltIn()
  // console.log(ac.gray.dim('>> fileserves '))
  await DeployRootFileserves()
  // console.log(ac.gray.dim('>> api built in '))
  await DeployApiBuiltin()
  // console.log(ac.gray.dim('>> past api built in '))

  // make a private api
  // const fs = require('fs')
  // const os = require('os')
  // const path = require('path')

  // console.log(ac.gray.dim('>> create staging folder '))

  let tmpDir
  let apiBytes
  const appPrefix = 'MistLift'
  try {
    tmpDir = path.join(os.tmpdir(), appPrefix)
    // console.log("making "+tmpDir)
    mkdirSync(tmpDir, { recursive: true })

    const yamlFile = path.join(tmpDir, 'papi.yaml')
    // console.log(ac.gray.dim('>> Make builtin ApiDoc '))
    await MakeBuiltinApiDoc(yamlFile)
    // console.log(ac.gray.dim('>> Past making builtin ApiDoc '))
    // console.log("reading "+yamlFile)
    apiBytes = fs.readFileSync(yamlFile)
  } catch (e: any) {
    console.error(ac.red.bold('Error creating temp staging folder ') + (e.message as string))
    throw Error()
  } finally {
    try {
      if (tmpDir !== undefined) {
        fs.rmSync(tmpDir, { recursive: true })
      }
    } catch (e: any) {
      console.error(`An error has occurred while removing the temp folder at ${tmpDir ?? ''}. Please remove it manually. Error: ${(e.message as string)}`)
    }
  }
  // console.log(ac.gray.dim('>> past that part, onto API Gateway '))

  const client = new APIGatewayClient(getAWSCredentials())

  // console.log(ac.gray.dim('>> remove Existing versions '))
  await RemoveExistingVersions(client)

  const command: any = new ImportRestApiCommand({
    failOnWarnings: false,
    body: apiBytes
  })
  let apiId: string = ''
  try {
    const response: any = await client.send(command)
    const { name, id, version, warnings } = response
    console.log(ac.grey(`\n\nAPI ${name as string ?? ''} version ${version as string ?? ''}  [${id as string ?? ''}] schema created`))
    apiId = id ?? ''
    if (warnings?.length !== 0) {
      console.log(ac.magenta(` with ${(warnings as string[])?.length ?? 0} warnings`))
      if (warnings !== undefined) {
        for (const warning of warnings) {
          console.log(ac.grey.italic(`    ${warning as string}`))
        }
      }
    }
  } catch (e: any) {
    console.error(ac.bold.red(e.message))
  }

  // const apidoc = new TextDecoder().decode(apiBytes)
  // console.log(apidoc)
  if (apiId === '') return

  console.log(ac.grey('Continuing with binding...'))
  const prereq = await PrequisiteValues(apiId ?? '')
  // console.log(ac.gray.dim('>> making intRequests'))
  const intRequests = prereq.MakeRequests()
  // console.log(ac.magenta.dim('>> putting integration'), intRequests)
  await PutIntegrations(intRequests)
  await DeployApi(apiId ?? '', stageName)
  const region = getSettings()?.awsPreferredRegion ?? ''
  const publishUrl = `https://${apiId ?? ''}.execute-api.${region}.amazonaws.com/${stageName}`
  console.log(ac.green.bold(`\n Successfully deployed to ${publishUrl}`))
  recordLatestPublish(publishUrl)
}

function findApiName (): string {
  const infoFile = path.join(projectPaths.functionPath, 'apiService.info.json')
  const pkgFile = projectPaths.packagePath
  let pkg: any = {}
  if (fs.existsSync(pkgFile)) { pkg = JSON.parse(fs.readFileSync(pkgFile).toString()) }
  let info: any = {}
  if (fs.existsSync(infoFile)) { info = JSON.parse(fs.readFileSync(infoFile).toString()) }

  return info.title ?? pkg.name ?? 'API'
}

async function RemoveExistingVersions (client: APIGatewayClient): Promise<void> {
  await new Promise(resolve => {
    const ourName = findApiName()
    const listCommand: any = new GetRestApisCommand({})
    client.send(listCommand).then((response: any) => {
      const DeleteMatchingApis = async (i: number = 0): Promise<any> => {
        if (i >= response.items.length) {
          resolve(undefined)
          return await Promise.resolve(undefined)
        }
        const item: { name: string, id: string } = response.items[i]
        if (item.name === ourName) {
          const deleteCommand: any = new DeleteRestApiCommand({
            restApiId: item.id
          })
          try {
            await client.send(deleteCommand)
            await delay(5000)
            console.log(ac.magenta.bold(`Removed previous id ${item.id}`))
          } catch (e: any) {
            console.error(`Failed to delete previous id ${item.id}: ${e.message as string}`)
          }
        }
        return await DeleteMatchingApis(++i)
      }
      DeleteMatchingApis().catch<any>((reason: any) => undefined)
    }).catch<any>((reason: any) => undefined)
  }).catch<any>((reason: any) => undefined)
}

class FunctionInfo {
  name: string = ''
  arn: string = ''
}

class PrereqInfo {
  requestApiId: string = ''
  functions: FunctionInfo[] = []
  apis: any[] = [] // Resource + method
  defs: any[] = []

  public constructor () {
    this.functions = []
    this.apis = []
    this.defs = []
  }

  public findApi (pathMap: string, allowedMethods: string): any {
    // find the pathmap in the apis list
    // console.log("findApi "+pathMap, allowedMethods)
    // see that this method exists in method map
    for (const api of this.apis) {
      if (api?.path === pathMap) {
        // console.log("resourceMethods", api.resourceMethods)
        const methodList: string[] = Object.getOwnPropertyNames(api.resourceMethods)
        // console.log("methodList", methodList)
        for (const meth of allowedMethods.toUpperCase().split(',')) { // NOTE: we no longer try to support multiples, but this still works as is.
          // console.log("meth", meth)
          if (methodList.includes(meth)) {
            (api).method = meth
            return api
          }
        }
      }
    }
    return null
  }

  public findARN (name: string): string {
    let lastus = name.lastIndexOf(getIdDelimiter())
    if (lastus !== -1) name = name.substring(0, lastus)
    // console.warn(`>>> finding name ${name} in ${this.functions.length} functions`)
    for (const f of this.functions ?? []) {
      lastus = f.name.lastIndexOf(getIdDelimiter())
      const fname = f.name.substring(0, lastus)
      // console.warn('comparing name, fname, lc ', {lastus, fname, name})
      if (fname.toLowerCase() === name.toLowerCase()) {
        // console.warn(">>> Match! ", f)
        return f.arn
      }
    }
    console.error(ac.red.bold("$$ Couldn't find " + name + ' in integration list'))
    process.exit(1)
    return ''
  }

  public MakeRequests (): PutIntegrationRequest[] {
    const region = getSettings()?.awsPreferredRegion ?? ''
    const out: PutIntegrationRequest[] = []

    for (const d of this.defs) {
      const def = (d)
      // console.log(ac.magenta.dim('>> finding api and arn for '), {pathMap:def.pathMap, name: def.name})
      const api = this.findApi(def.pathMap, def.method)
      const arn = this.findARN(def.name) ?? ''
      if (arn === '') {
        console.log(ac.red.dim(`>>> No ARN for ${(def.name as string)} ${(def.pathMap as string)}, ${(api.id as string)}`))
        process.exit(1)
      }
      // console.log(ac.magenta.dim.italic('>> api for '+arn), api)
      if (api !== null && api !== undefined && arn !== '') {
        out.push({
          restApiId: this.requestApiId,
          resourceId: api.id, // api.parentId
          httpMethod: api.method,
          integrationHttpMethod: 'POST', // api.method,
          type: 'AWS_PROXY',
          uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${arn}/invocations`,
          credentials: 'arn:aws:iam::545650260286:role/TBDLambdaExecution2'
        })
      }
    }
    return out
  }
}

async function PrequisiteValues (id: string): Promise<PrereqInfo> {
  const pri = new PrereqInfo()
  const out = await GetFunctionInfo(pri)
  out.defs = gatherFunctionDefinitions()
  addBuiltInDefinitions(out.defs)
  out.requestApiId = id
  await GetMethodResources(id, out)

  return out
}

async function GetFunctionInfo (info: PrereqInfo): Promise<PrereqInfo> {
  const client = new LambdaClient(getAWSCredentials())
  const listCommand: any = new ListFunctionsCommand({})
  const response: any = await client.send(listCommand)

  const sfx = getIdSrc()

  for (const func of response.Functions ?? []) {
    const fName: string = func?.FunctionName ?? ''
    // console.log(ac.gray.dim('>> checking if '+fName+' has our suffix '+sfx))
    if (fName.includes(sfx)) {
      // console.log(ac.gray.dim('>>> Yes'))
      info.functions.push({
        name: func.FunctionName ?? '',
        arn: func.FunctionArn ?? ''
      })
    }
  }
  return info
}

async function GetMethodResources (
  id: string,
  info: PrereqInfo
): Promise<PrereqInfo> {
  const client = new APIGatewayClient(getAWSCredentials())
  const listCommand: any = new GetResourcesCommand({
    restApiId: id
  })
  const response: any = await client.send(listCommand)
  // ClogInfo("Resources response", response)
  if ((response?.items) != null) info.apis = response.items

  return info
}

async function PutIntegrations (integrations: PutIntegrationRequest[]): Promise<void> {
  const client = new APIGatewayClient(getAWSCredentials())
  for (const input of integrations) {
    try {
      const command: any = new PutIntegrationCommand(input)
      /* const intResp = */ await client.send(command)
      // ClogDebug("integration response", intResp);
      await delay(5000)
    } catch (e: any) {
      console.error('Problem with integration for ' + (input.uri as string), { input })
      throw e
    }
  }
}

async function DeployApi (restApiId: string, stageName: string): Promise<void> {
  try {
    const client = new APIGatewayClient(getAWSCredentials())
    const command: any = new CreateDeploymentCommand({
      restApiId,
      stageName
    })
    await client.send(command)
  } catch (e: any) {
    console.error(ac.red.bold(`Fatal Error with deployApi: ${e.message as string}`))
    process.exit(-1)
  }
}

function recordLatestPublish (publishUrl: string): void {
  const publishRecord = {
    url: publishUrl,
    time: Date.now()
  }
  const publishedFile = path.join(projectPaths.basePath, '.published')
  fs.writeFileSync(publishedFile, JSON.stringify(publishRecord))
}
