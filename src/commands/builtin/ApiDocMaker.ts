import { gatherFunctionDefinitions } from '../../lib/openAPI/ApiBuildCollector'
import { buildOpenApi } from '../../lib/openAPI/openApiConstruction'
import { GetWebrootServePaths } from '../../lib/openAPI/WebrootFileSupport'

import path from 'path'

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
  const defs = gatherFunctionDefinitions()
  addBuiltInDefinitions(defs)
  return await buildOpenApi(defs, false, yamlFile) //, true)
}

export function addBuiltInDefinitions (defs: any[]): void {
  // console.warn("NOT ADDING ANY BUILTIN API INTEGRATIONS")
  // console.log("ADDING apiDef");
  defs.push(apiDef)
  defs.push(webrootDef)

  // console.warn("Adding webroot literals");
  // do just /docs and see how that goes
  const fsdef = Object.assign({}, fileServeDef) // copy
  fsdef.name = 'fileserve_docs'
  fsdef.pathMap = '/docs/{path}'
  defs.push(fsdef)
  const roots = GetWebrootServePaths()
  // console.log("roots", roots)
  for (const root of roots) {
    if (root !== '') {
      const rootPath = root.replace(path.sep, '/')
      let rootName = rootPath
      while (rootName.includes('/')) rootName = rootPath.replace('/', '').toLowerCase().trim()
      const fileserve = Object.assign({}, fileServeDef) // copy
      fileserve.name = 'fileserve_' + rootName
      fileserve.pathMap = `${rootPath}/{path}`
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
