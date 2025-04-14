/**
 * This is part 2 of 2 -- we take our pre-built json array of definitions and apply them to openApi in this phase.
 */
import { OpenApiBuilder } from 'openapi3-ts/oas30'
import fs from 'fs'
import path from 'path'
import { resolvePaths } from '../pathResolve'
import * as ac from 'ansi-colors'
import { decoratedName, getAccountId } from '../IdSrc'
import { getAWSCredentials, getSettings } from '../LiftConfig'
import {parseConstraints, TypeConstraint} from "../TypeCheck";
import yaml from 'js-yaml'

export async function buildOpenApi (
  defs: any[],
  includePrivate: boolean = false,
  includeCORS: boolean = false,
  yamlFile?: string
): Promise<Uint8Array> {
  const builder = new OpenApiBuilder()

  // console.log("buildOpenApi to "+yamlFile)

  const projectPaths = await resolvePaths()
  if (!projectPaths.verified) return new Uint8Array(0) // don't continue if not valid

  // Read our package.json and construct info from that
  const pkgFile = projectPaths.packagePath
  let pkg: any = {}
  try { pkg = JSON.parse(fs.readFileSync(pkgFile).toString()) } catch {}
  const title: string = pkg.name ?? ''
  // let summary = pkg.description;
  // let spdx: string = pkg.license ?? ''
  // const contactName: string = pkg.author ?? ''
  const version: string = pkg.version ?? ''

  // license and version definitely come from package.json
  // description and title might get overridden by service.info file
  const infoFile = path.join(projectPaths.functionPath, 'apiService.info.json')
  let svcInfo: any = {}
  if (fs.existsSync(infoFile)) {
    svcInfo = JSON.parse(fs.readFileSync(infoFile).toString())
  }
  // spdx = svcInfo.contact?.spdx ?? spdx

  // const stagePathSegment = '/Dev' // todo: at some point this should be in config somewhere. it is used in many places.

  const info = {
    title: svcInfo.name ?? title,
    // summary: summary,
    description: svcInfo.description,
    version: svcInfo.version ?? version ?? new Date().toUTCString()
  }
  builder.addInfo(info);

  // map our defs into openApi values
  for (const def of defs) {
    const pathDef = {}
    if (def.private === true && !includePrivate) continue // skip private

    const parameters = def.parameters ?? []
    let method = def.method
    if (def.method === undefined) {
      console.log(ac.red(`no method defined for ${def.name as string}`))
      if (def.allowedMethods !== undefined) {
        console.log(ac.bgBlack.yellowBright('DEPRECATED') + ac.blue(' As of v1.1.8, The use of ') + ac.black.italic('allowedMethods') + ac.blue(' is replaced by the single' +
            ac.black.italic(' method ') + ac.blue('property.') + ac.black.bold('Please update your definition file')))
        def.method = def.allowedMethods.split(',')[0]
      }
    }
    const schemas = def.schemas ?? {}
    for (const schemaName of Object.getOwnPropertyNames(schemas)) {
      const schema = schemas[schemaName]
      addTypeSchema(builder, schemaName, schema)
    }
    method = method.trim().toLowerCase()
    await addFunctionMethod(pathDef, method, def, includeCORS)
    for (const param of parameters) {
      addParameter(pathDef, param)
    }
    if(includeCORS) addCORSOptionMethod(pathDef)
    let pathMap = def.pathMap ?? '/' + (def.name as string)
    pathMap = pathMap.replace('?', '')

    // pathMap = stagePathSegment + pathMap
    builder.addPath(pathMap, pathDef)

    builder.addSchema('Empty', {
      title: 'Empty Schema',
      type: 'object'
    })
  }

  const outFile = yamlFile ?? path.join(projectPaths.basePath, 'webroot', 'docs', 'apidoc.yaml')

  const str2ab = (str: string): Uint8Array => {
    const buf = new ArrayBuffer(str.length * 2) // 2 bytes for each char
    const bufView = new Uint8Array(buf)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i)
    }
    return bufView
  }

  const spec = builder.getSpec()
  spec['x-amazon-apigateway-binary-media-types'] = [
    'application/octet-stream',
    'image/*',
    'audio/*'
  ]
  const yamlSpec = yaml.dump(spec)
  const bytes = str2ab(yamlSpec)
  // if (!includePrivate) {
    fs.writeFileSync(outFile, yamlSpec)
  // }
  return bytes
}

function addTypeSchema(builder: any, schemaName: string, schema: any): void {

  let primType = ''
  let type = schema?.type ?? 'Empty'
  if (type === 'empty') type = 'Empty' // fix case
  let isArray = (type.endsWith('[]'))
  if (isArray) type = type.substring(0, type.length - 2)
  if (type === 'string' || type === 'number' || type === 'object') primType = type
  const mime = schema?.mime ?? primType ? 'text/plain' : 'application/json'
  const sref = primType ? {type: primType} : {'$ref': '#/components/schemas/' + type}
  let ref: any = {}
  if (isArray) {
    ref = {type: "array", items: sref}
  } else {
    ref = sref
  }

  ref.title = schemaName

  if (ref.type === 'object') ref.properties = {}

  const constraints = schema.type !== 'object' && Array.isArray(schema?.constraints) ? parseConstraints(schema.type, schema.constraints.join('\n'), '\n') : undefined

  let cdesc = constraints ? '\n  - ' + (constraints.describe() ?? '').split('\n').join('\n  - ') : ''
  let description = schema.description
  if (cdesc) description += cdesc

  ref.description = description


  const required: string[] = []

  if(ref.properties) {
      for (const [propName, propDef] of Object.entries(schema.properties || {})) {
        const pda = propDef as any
        const constraints = Array.isArray(pda?.constraints) ? parseConstraints(pda.type, pda.constraints.join('\n'), '\n') : undefined

        let cdesc = constraints ? '\n  - ' + (constraints.describe() ?? '').split('\n').join('\n  - ') : ''
        let description = (propDef as any).description
        if (cdesc) description += cdesc

        // if(constraints) {
        //   console.log("schema definition for "+schemaName+', prop '+propName)
        //   console.log(description)
        // }

        const propSchema: any = {
          type: (propDef as any).type,
          description
        }

        // You can add other custom handling here (e.g., enums, format, pattern)
        ref.properties[propName] = propSchema

        // Only mark as required if declared explicitly
        if (schema.required && schema.required.includes(propName)) {
          required.push(propName)
        }
      }

      if (required.length > 0) {
        ref.required = required
      }
  }
  builder.addSchema(schemaName, ref)
}

async function addFunctionMethod (pathDef: any, method: string, def: any, includeCORS = true): Promise<void> {

  const retDef: any = (def.returns)['200']
  const content: any = {}
  let primType = ''
  let type = retDef?.type ?? 'Empty'
  if (type === 'empty') type = 'Empty' // fix case
  let isArray = (type.endsWith('[]'))
  if(isArray) type = type.substring(0,type.length-2)
  if (type === 'string' || type === 'number' || type === 'object') primType = type
  const mime = retDef?.mime ?? primType ? 'text/plain' : 'application/json'
  const ref = primType ? {type: primType} : {'$ref': '#/components/schemas/' + type}
  let schema:any
  if(isArray) {
    schema = { type:"array", items: ref }
  } else {
    schema = ref
  }
  content[mime] = {
    schema
  }

  const region = getSettings()?.awsPreferredRegion ?? ''
  const accountId = await getAccountId()
  const decName = decoratedName(def.name)

  const isBinary = def.bodyType && !def.bodyType.startsWith('text') && !def.bodyType.endsWith('json')

  const methData = {
    summary: def.name,
    description: def.description,
    responses: {
      200: {
        description: retDef?.description ?? 'Success Response',
        headers: includeCORS ? {
          'Access-Control-Allow-Origin': {
            schema: {
              type: 'string'
            },
            example: '*'
          },
          'Access-Control-Allow-Headers': {
            schema: {
              type: 'string'
            },
            example: 'Content-Type, Authorization'
          },
          'Access-Control-Allow-Methods': {
            schema: {
              type: 'string'
            },
            example: 'GET,POST,PUT,OPTIONS'
          }
        } : undefined,
        content
      }
    },
    'x-amazon-apigateway-integration': {
      uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${region}:${accountId}:function:${decName}/invocations`,
      passthroughbehavior: 'when_no_match',
      contentHandling: isBinary ? "CONVERT_TO_BINARY" : undefined,
      httpMethod: 'POST', // always POST - this is how API gateway calls Lambda, not the method of the api
      type: 'aws_proxy'
    }
  }

  if(!includeCORS) {
    // get the other response code declarations
    for (let rcode of Object.getOwnPropertyNames(def.returns)) {
      if (rcode != "200") {
        const retDef = def.returns[rcode] ?? {}

        const content: any = {}
        let primType = ''
        let type = retDef?.type ?? 'Empty'
        if (type === 'empty') type = 'Empty' // fix case
        let isArray = (type.endsWith('[]'))
        if(isArray) type = type.substring(0,type.length-2)
        if (type === 'string' || type === 'number' || type === 'object') primType = type
        const mime = retDef?.mime ?? primType ? 'text/plain' : 'application/json'
        const ref = primType ? {type: primType} : {'$ref': '#/components/schemas/' + type}
        let schema:any
        if(isArray) {
          schema = { type:"array", items: ref }
        } else {
          schema = ref
        }
        content[mime] = {
          schema
        }
        retDef.content = content;
        (methData.responses as any)[rcode] = retDef
      }
    }
  }

  pathDef[method] = methData
}
function addCORSOptionMethod (pathDef: any): void {
  // if (pathDef.options === undefined) return // already assinged by definition
  // add options for CORS
  pathDef.options = {
    summary: 'CORS support',
    responses: {
      200: {
        description: 'CORS response',
        headers: {
          'Access-Control-Allow-Origin': {
            schema: {
              type: 'string'
            },
            example: '*'
          },
          'Access-Control-Allow-Methods': {
            schema: {
              type: 'string'
            },
            example: 'GET,POST,PUT,OPTIONS'
          },
          'Access-Control-Allow-Headers': {
            schema: {
              type: 'string'
            },
            example: 'Content-Type, Authorization'
          }
        }
      }
    },
    'x-amazon-apigateway-integration': {
      type: 'mock',
      requestTemplates: {
        'application/json': '{"statusCode": 200}'
      },
      responses: {
        default: {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Methods': "'GET, POST, PUT, OPTIONS'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type, Authorization'"
          }
        }
      },
      passthroughBehavior: 'when_no_match'
    }
  }
}

function addParameter (pathDef: any, param: any): void {
  if (pathDef.parameters === undefined) pathDef.parameters = []
  const parameters = pathDef.parameters
  const example = param.example ?? ''
  const type = param.type ?? 'string'
  const deflt = param.default ?? ''

  // parameter is always required if it comes from path
  // never required if it comes from query
  // and may or may not be if it comes from body (per def)
  let src = param?.in?.trim().toLowerCase() ?? ''
  let required = (src === 'path')
  if(src === 'body') required = param.required ?? false

  const constraints = Array.isArray(param.constraints) ? parseConstraints(param.type, param.constraints.join('\n'), '\n') : undefined

  let cdesc = constraints ? '\n  - ' + (constraints.describe() ?? '').split('\n').join('\n  - ') : ''
  let description = param.description
  if(cdesc) description += cdesc

  // don't declare parameters marked as 'body'.  OpenAPI doesn't support that.
  if(param.in === 'path' || param.in === 'query') {
    parameters.push({
      in: param.in,
      name: param.name,
      description,
      example: example ? example : undefined,
      required,
      schema: schemaType(deflt, type, true)
    })
  }
}



function schemaType (deflt: string|undefined, namedType: string, innerOnly: boolean): any {
  if (typeof namedType === 'object') return namedType
  const typeFormat = namedType.split(':')
  let type = typeFormat[0]
  const format = typeFormat.length > 1 ? typeFormat[1] : undefined
  if (!(type === 'string' ||
        type === 'number' ||
        type === 'integer' ||
        type === 'boolean' ||
        type === 'int' ||
        type === 'bool'
  )) {
    return innerOnly
      ? {
          $ref: `#/components/schemas/${type}`
        }
      : {
          schema: {
            $ref: `#/components/schemas/${type}`
          }
        }
  }
  if (type === 'int') type = 'integer'
  if (type === 'bool') type = 'boolean'
  if(!deflt) deflt = undefined
  return innerOnly ? { type, format, example: deflt } : { schema: { type, format, example: deflt } }
}
