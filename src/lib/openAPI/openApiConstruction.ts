/**
 * This is part 2 of 2 -- we take our pre-built json array of definitions and apply them to openApi in this phase.
 */
import { OpenApiBuilder } from 'openapi3-ts/oas30';
import fs, {mkdirSync} from 'fs'
import path from 'path'
import {resolvePaths} from "../pathResolve";
import {recurseDirectory} from "../DirectoryUtils";
import {getSettings} from "../LiftConfig";

export async function buildOpenApi(
    defs:any[],
    includePrivate:boolean = false,
    yamlFile?:string
):Promise<Uint8Array>
{
    const builder = new OpenApiBuilder();

    const projectPaths = await resolvePaths();
    if(!projectPaths.verified) return new Uint8Array(0); // don't continue if not valid

    // Read our package.json and construct info from that
    const pkgFile = projectPaths.packagePath;
    let pkg:any = {}
    try { pkg = JSON.parse(fs.readFileSync(pkgFile).toString()); } catch {}
    let title = pkg.name;
    // let summary = pkg.description;
    let spdx = pkg.license;
    let contactName = pkg.author;
    let version = pkg.version;

    // license and version definitely come from package.json
    // description and title might get overridden by service.info file
    const infoFile = path.join(projectPaths.functionPath, "apiService.info.json")
    var svcInfo:any = {};
    if(fs.existsSync(infoFile)) {
        svcInfo = JSON.parse(fs.readFileSync(infoFile).toString())
    }
    spdx = svcInfo.contact?.spdx ?? spdx;

    const info = {
        title: svcInfo.name ?? title,
        // summary: summary,
        description: svcInfo.description,
        version: svcInfo.version ?? version ?? new Date().toUTCString()
    }
    builder.addInfo(info)

    // map our defs into openApi values
    for (let def of defs) {
        let pathDef = {}
        if(def.private && !includePrivate) continue; // skip private

        const parameters = def.parameters ?? []
        const methods = def.allowedMethods.split(',')
        const schemas = def.schemas ?? {}
        for(let schemaName of Object.getOwnPropertyNames(schemas)) {
            const schema = schemas[schemaName];
            addTypeSchema(builder, schemaName, schema)
        }
        for (let method of methods) {
            method = method.trim().toLowerCase()
            addFunctionMethod(pathDef, method, def)
            for (let param of parameters) {
                addParameter(pathDef, param)
            }
        }
        addCORSOptionMethod(pathDef)
        builder.addPath((def.pathMap ?? "/"+def.name), pathDef)

        builder.addSchema("Empty",{
            title : "Empty Schema",
            type:"object"
        })
    }

    const outFile = yamlFile ?? path.join(projectPaths.basePath, 'webroot', 'docs','apidoc.yaml')

    const str2ab = (str:string):Uint8Array => {
        var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return bufView;
    }

    const yaml = builder.getSpecAsYaml();
    const bytes = str2ab(yaml);
    if(!includePrivate) {
        fs.writeFileSync(outFile, yaml)
    }
    return bytes
}

function addTypeSchema(builder:any, schemaName:string, schema:any)
{
    const ref:any = {title: schemaName, type:"object", properties:{}}
    for(let prop of Object.getOwnPropertyNames(schema))
    {
        const scType:any = schemaType("", schema[prop],false)

        ref.properties[prop] = scType
    }

    builder.addSchema(schemaName, ref)
}

function addFunctionMethod(pathDef:any, method:string, def:any) {

    // TODO: Define a return schema and put that here
    const retDef:any = (def.returns as any)["200"];
    const content:any = {}
    const mime = retDef?.content ?? retDef?.mime ?? "text/plain"
    content[mime] = {}

    const region = getSettings().awsPreferredRegion;
    const accountId = "545650260286";
    const methData = {
        summary: def.name,
        description: def.description,
        responses: {
            "200": {
                description: retDef?.description ?? "Success Response",
                content
            }
        }
    }
    pathDef[method] = methData;
}
function addCORSOptionMethod(pathDef:any) {
    if (pathDef["options"]) return; // already assinged by definition
    // add options for CORS
    pathDef["options"] = {
        "responses" : {
            "200" : {
                "description" : "200 response",
                "content" : {
                    "application/json" : {
                        "schema" : {
                            "$ref" : "#/components/schemas/Empty"
                        }
                    }
                }
            }
        },
        "x-amazon-apigateway-integration" : {
            "responses" : {
                "default" : {
                    "statusCode" : "200"
                }
            },
            "requestTemplates" : {
                "application/json" : "{\"statusCode\": 200}"
            },
            "passthroughBehavior" : "when_no_match",
            "type" : "mock"
        }
    }
}

function addParameter(pathDef:any, param:any) {
    if(!pathDef.parameters) pathDef.parameters = [];
    const parameters = pathDef.parameters
    const example = param.example ?? param.default ?? "";
    const type = param.type ?? typeof example
    let deflt = param.default ?? example

    parameters.push({
        in: param.in,
        name: param.name,
        description: param.description,
        example: example,
        required: param.required,
        schema: schemaType(deflt, type, true)
    })

}

function schemaType(deflt:string, namedType:string, innerOnly:boolean) {
    if(typeof namedType == "object") return namedType;
    const typeFormat = namedType.split(':')
    let type = typeFormat[0]
    const format = typeFormat.length > 1 ? typeFormat[1] : undefined
    if(!(  type === "string"
        || type === "number"
        || type === "integer"
        || type === "boolean"
        || type === "int"
        || type === "bool"
    )) {
        return innerOnly ? {
            $ref: `#/components/schemas/${type}`
        } : { schema: {
                $ref: `#/components/schemas/${type}`
        } }
    }
    if( type === 'int') type = 'integer';
    if( type === 'bool') type = 'boolean';
    return innerOnly ? { type, format, example:deflt } : { schema: { type, format, example:deflt } }

}
