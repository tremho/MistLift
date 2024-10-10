
import {
  LambdaClient,
  CreateFunctionCommand,
  DeleteFunctionCommand,
  AddPermissionCommand
} from '@aws-sdk/client-lambda'

// import md5 from 'md5'

import path from 'path'
import fs from 'fs'
import { resolvePaths } from '../lib/pathResolve'

import * as ac from 'ansi-colors'

import { recurseDirectory } from '../lib/DirectoryUtils'

import { delay } from '../lib/utils'
import { doPackageAsync } from './package'
import { getAWSCredentials, getSettings, RuntimeType } from '../lib/LiftConfig'
import { decoratedName } from '../lib/IdSrc'
// import { executeCommand } from '../lib/executeCommand'

let projectPaths: { basePath: string, buildPath: string, functionPath: string, packagePath: string, verified: boolean }

let deploymentRecord: any = {} // a map of last deployment times

// package then deploy
export async function doDeployAsync (
  args: string[]
): Promise<number> {
  projectPaths = resolvePaths()
  if (!projectPaths.verified) {
    console.log(ac.bold.magenta('current directory is not at project root'))
    return -1
  }
  const deploymentRecordPath = path.join(projectPaths.basePath, '.deployed')
  try { deploymentRecord = JSON.parse(fs.readFileSync(deploymentRecordPath).toString()) } catch {}

  const funcsToDeploy: string[] = []
  const options: string[] = []
  for (const arg of args) {
    if (arg.charAt(0) === '-') {
      options.push(arg.toLowerCase())
    } else funcsToDeploy.push(arg)
  }

  if (!options.includes('--no-package')) {
    const ret = await doPackageAsync(args)
    if (ret !== 0) return ret
    else await delay(2500)
  }

  if (options.includes('--clean')) {
    deploymentRecord = {}
  }

  if (funcsToDeploy.length === 0) {
    let firstDepth = 0
    recurseDirectory(projectPaths.functionPath, (filepath, stats) => {
      const depth = filepath.split(path.sep).length
      if (firstDepth === 0) firstDepth = depth
      if (stats.isDirectory() && depth === firstDepth) {
        funcsToDeploy.push(path.basename(filepath))
      }
      return false
    })
  }

  for (const funcName of funcsToDeploy) {
    const zipFile = path.join(projectPaths.basePath, 'MistLift_Zips', funcName + '.zip')
    if (fs.existsSync(zipFile)) {
      const zipTime = fs.statSync(zipFile).mtime
      if (zipTime.getTime() > (deploymentRecord[funcName] ?? 0)) {
        await deployPackage(funcName)
        deploymentRecord[funcName] = Date.now()
      }
    } else {
      console.error('deploy: ' + zipFile + ac.red.bold(` ${funcName} does not exist`))
      return -1
    }
  }

  try { fs.writeFileSync(deploymentRecordPath, JSON.stringify(deploymentRecord)) } catch {}

  return 0
}

// ------------

export async function deployPackage (
  funcName: string,
  zipFile?: string
): Promise<void> {
  // first off, anchor a base directory
  projectPaths = resolvePaths()
  zipFile ??= path.join(projectPaths.basePath, 'MistLift_Zips', funcName + '.zip')
  const defFile = path.join(projectPaths.basePath, 'functions', funcName, 'src', 'definition.json')
  let def: any = {}
  try {
    def = JSON.parse(fs.readFileSync(defFile).toString())
  } catch (e: any) {
    // hack for assigning a definition -- the defs from ApiDocMaker don't appear here
    if (funcName === 'Webroot') {
      def.name = 'Webroot'
      def.timeoutSeconds = 8
      def.memorySize = 256
    }
  }
  const timeout: number = def.timeoutSeconds ?? 0 // zero will mean default (3 seconds on AWS)
  const memorySize: number = def.memorySize ?? 0 // zero is default (128 [mb] for AWS)
  // funcname gets decorated with current instance identifier
  const dFuncName = decoratedName(funcName)

  // See if function exists
  const client: any = new LambdaClient(getAWSCredentials())
  const command: any = new DeleteFunctionCommand({
    FunctionName: dFuncName
  })
  client.send(command).then((response: any) => {
  }).catch((e: any) => {
  })

  // Use to detect runmain.mjs in zips (including built-ins)
  // console.log(ac.green.italic("deploying ")+ac.green.bold(funcName)+" from "+zipFile)
  // await executeCommand('unzip', ['-t', zipFile, '|', 'grep runmain.mjs'], '', true);

  try {
    const response: any = await CreateCloudFunction(dFuncName, zipFile, timeout, memorySize)
    const parts = response.FunctionArn.split(':')
    const principal = parts[4]
    await AddPermissions(client, dFuncName, principal)
    let deployMsg: string = `Successfully deployed ${funcName}`
    if (memorySize > 0 || timeout > 0) {
      deployMsg += ac.grey.italic(' with ')
      const useAnd = memorySize > 9 && timeout > 0
      if (memorySize > 0) {
        deployMsg += ac.grey(`memorySize ${memorySize}mb`)
        if (useAnd) deployMsg += ac.grey.italic(' and ')
      }
      if (timeout > 0) {
        deployMsg += ac.grey(`timeout ${timeout} seconds`)
      }
    }

    console.log(ac.green.bold(deployMsg))
  } catch (e: any) {
    console.error(ac.red.bold.italic('Error deploying ' + funcName), e)
  }
}
async function CreateCloudFunction (
  funcName: string,
  zipFile: string,
  timeout: number,
  memorySize: number

): Promise<any> {
  const settings = getSettings()
  const nodeRuntime: RuntimeType | undefined = settings.awsNodeRuntime
  const serviceRole: string = settings.awsServiceRoleARN ?? ''
  const zipFileBase64: Uint8Array = fs.readFileSync(zipFile)
  const client: any = new LambdaClient(getAWSCredentials())
  const command: any = new CreateFunctionCommand({
    FunctionName: funcName,
    Runtime: nodeRuntime,
    Role: serviceRole,
    Handler: 'runmain.handler',
    Code: {
      ZipFile: zipFileBase64
    },
    Timeout: timeout > 0 ? timeout : undefined,
    MemorySize: memorySize > 0 ? memorySize : undefined
  })
  const resp = await client.send(command) // response
  return resp
}

async function AddPermissions (
  client: LambdaClient,
  funcName: string,
  principal: string
): Promise<any> {
  const region = getSettings().awsPreferredRegion ?? ''
  const WSApi = '/' + funcName.toLowerCase()
  const command: any = new AddPermissionCommand({
    FunctionName: funcName,
    StatementId: 'InvokePermission',
    Action: 'lambda:invokeFunction',
    Principal: 'apigateway.amazonaws.com',
    SourceArn: `arn:aws:execute-api:${region}:${principal}:${WSApi}`
  })
  const resp = await client.send(command)
  return resp
}
