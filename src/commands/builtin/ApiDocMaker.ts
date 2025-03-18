import { gatherFunctionDefinitions } from '../../lib/openAPI/ApiBuildCollector'
import { buildOpenApi } from '../../lib/openAPI/openApiConstruction'
import { GetWebrootServePaths } from '../../lib/openAPI/WebrootFileSupport'

import path from 'path'
// import * as ac from 'ansi-colors'
import { decoratedName } from '../../lib/IdSrc'
import {getWebrootSettings} from "./ExportWebroot";

export async function MakePublicApiDoc
(
): Promise<Uint8Array> {
  const defs = gatherFunctionDefinitions()
  return await buildOpenApi(defs)
}

export async function MakeBuiltinApiDoc
(
  yamlFile: string

): Promise<Uint8Array> {
  // console.log(ac.gray.dim('>>> gatherFunctionDefinitions '))
  const defs = gatherFunctionDefinitions()
  // console.log(ac.gray.dim('>> after gatherfunctions'), defs)
  // console.log(ac.gray.dim('>>> addBuiltInDefinitions '))
  const wrs = await getWebrootSettings()
  const withWebroot = (wrs.webrootMethod ?? 'SELF') === 'SELF'
  console.log("wrs.webrootMethod=",wrs.webrootMethod)
  addBuiltInDefinitions(defs, withWebroot)
  // console.log(ac.gray.dim('>> after addBuiltIns'), defs)
  // console.log(ac.gray.dim('>>> buildOpenApi '))
  return await buildOpenApi(defs, false, yamlFile) //, true)
}

export function addBuiltInDefinitions (defs: any[], withWebroot: boolean): void {
  // console.warn("NOT ADDING ANY BUILTIN API INTEGRATIONS")
  // console.log("ADDING apiDef");
  // console.log(ac.gray.dim('>>>> pushing apiDef '), apiDef)
  defs.push(apiDef)
  console.log("withWebroot = "+withWebroot)
  if (!withWebroot) return
  // console.log(ac.gray.dim('>>>> pushing webrootDef '), webrootDef)
  defs.push(webrootDef)

  // console.log(ac.gray.dim('>>>> Adding webroot literals '))
  // console.warn("Adding webroot literals");
  // do just /docs and see how that goes
  /*
  const fsdef = Object.assign({}, fileServeDef) // copy
  fsdef.name = decoratedName('fileserve_docs')
  fsdef.pathMap = '/docs/{path}'
  defs.push(fsdef)
   */
  const roots = GetWebrootServePaths()
  // console.log("roots", roots)
  // console.log(ac.gray.dim('>>>> roots here: '), roots)
  for (const root of roots) {
    // console.log(ac.gray.dim('>> top of loop with root '+root))
    if (root !== '') {
      const rootPath = root.replace(path.sep, '/')
      let rootName = rootPath
      // console.log(ac.gray.dim('>> rootName = '+rootName))
      while (rootName.includes('/')) rootName = rootName.replace('/', '').toLowerCase().trim()
      // console.log(ac.gray.dim('>> past stupid error = '+rootName))
      const fileserve = Object.assign({}, fileServeDef) // copy
      fileserve.name = decoratedName('fileserve_' + rootName)
      fileserve.pathMap = `${rootPath}/{path}`
      // console.log('pathmap = '+fileserve.pathMap)
      defs.push(fileserve)
    }
  }
}

const apiDef = {
  name: 'API',
  description: '',
  version: '1.0.0',
  pathMap: '/api',
  method: 'GET',
  logLevel: 'Debug',
  sessionRequired: false,
  userRequired: false,
  schemas: {},
  parameters: [],
  returns: {
    200: { type: 'empty', description: 'successful response.' },
    500: {
      type: 'string',
      description: 'Error details'
    }
  }
}

const fileServeDef = {
  name: 'FileServe',
  description: 'file service',
  version:
        '1.0.0',
  pathMap: '',
  method: 'GET',
  logLevel: 'Debug',
  sessionRequired: false,
  userRequired: false,
  schemas: {},
  parameters: [{ name: 'path', in: 'path' }],
  returns: {
    200: { type: 'empty', description: 'successful response.' },
    500: { type: 'string', description: 'Error details' }
  }
}

const webrootDef = {
  name: 'Webroot',
  description: 'Serves files from the webroot /',
  version: '1.0.0',
  pathMap: '/{path}',
  method: 'get',
  timeout: 8,
  memorySize: 1024,
  logLevel: 'Debug',
  sessionRequired: false,
  userRequired: false,
  schemas: {},
  parameters: [{ name: 'path', in: 'path' }],
  returns: {
    200: { type: 'empty', description: 'successful response.' },
    500: { type: 'string', description: 'Error details' }
  }
}
