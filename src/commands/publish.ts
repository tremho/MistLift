
import {
    LambdaClient,
    ListFunctionsCommand, ResourceNotFoundException,
} from "@aws-sdk/client-lambda";
import {
    APIGatewayClient,
    ImportRestApiCommand,
    GetRestApisCommand,
    GetResourcesCommand,
    DeleteRestApiCommand,
    Resource,
    PutIntegrationRequest,
    PutIntegrationCommand,
    GetStageCommand,
    NotFoundException,
    CreateStageCommand, CreateDeploymentCommand, GetDeploymentsCommand, GetDeploymentCommand
} from "@aws-sdk/client-api-gateway";

import {doDeployAsync} from "./deploy";
import * as ac from "ansi-colors"

import {executeCommand} from "../lib/executeCommand";

import path from 'path';
import fs, {mkdirSync} from 'fs';
import {all} from "axios";
import {resolvePaths} from "../lib/pathResolve";
import {gatherFunctionDefinitions} from "../lib/openAPI/ApiBuildCollector";
import {delay} from "../lib/utils";
import {addBuiltInDefinitions, MakeBuiltinApiDoc, MakePublicApiDoc} from "./builtin/ApiDocMaker";
import {DeployApiBuiltin, DeployRootFileserves, DeployWebrootBuiltIn} from "./builtin/BuiltInHandler";

let projectPaths:any;

export async function doPublishAsync(stageName?:string): Promise<number>
{
    // let retCode = await doDeployAsync([])
    // if(retCode) return retCode
    let retCode = 0;

    projectPaths = resolvePaths()

    await publishApi(stageName ?? "Dev")

    return retCode;
}


async function publishApi(stageName:string)
{
    if(!stageName) stageName = "Dev"
    console.log(ac.green.bold(`Publishing Api to ${stageName}`));

    // do the built-in deploys
    await DeployWebrootBuiltIn();
    await DeployRootFileserves();
    await DeployApiBuiltin();

    const projectPaths = resolvePaths();

    // make a private api
    const fs = require('fs');
    const os = require('os');
    const path = require('path');

    let tmpDir;
    let apiBytes;
    const appPrefix = 'MistLift';
    try {
        tmpDir = path.join(os.tmpdir(), appPrefix);
        console.log("making "+tmpDir)
        mkdirSync(tmpDir, {recursive:true});

        const yamlFile = path.join(tmpDir, 'papi.yaml')
        await MakeBuiltinApiDoc(yamlFile);
        console.log("reading "+yamlFile)
        apiBytes = fs.readFileSync(yamlFile)
    }
    catch (e:any) {
        console.error(ac.red.bold("Error creating temp staging folder ")+e.message);
        throw Error();
    }
    finally {
        try {
            if (tmpDir) {
                console.log("Removing "+tmpDir)
                fs.rmSync(tmpDir, { recursive: true });
            }
        }
        catch (e) {
            console.error(`An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`);
        }
    }

    const client = new APIGatewayClient({});

    await RemoveExistingVersions(client)

    const command = new ImportRestApiCommand({
        failOnWarnings: false,
        body: apiBytes
    })
    let apiId;
    try {
        const response = await client.send(command)
        const {name, id, rootResourceId, version, warnings} = response
        console.log(ac.grey(`\n\nAPI ${name} version ${version}  [${id}] schema created`))
        apiId = id;
        if (warnings?.length) {
            console.log(ac.magenta(` with ${warnings.length} warnings`))
            for (let warning of warnings) {
                console.log(ac.grey.italic(`    ${warning}`))
            }
        }
    }
    catch(e:any) {
        console.error(ac.bold.red(e.message));
    }
    var apidoc = new TextDecoder().decode(apiBytes);
    console.log(apidoc)
    if(!apiId) return;

    console.log(ac.grey("Continuing with binding..."))
    const prereq = await PrequisiteValues(apiId);
    const intRequests = prereq.MakeRequests();
    await PutIntegrations(intRequests);
    await DeployApi(apiId, stageName);
    console.log(ac.green.bold(`\n Successfully deployed to https://${apiId}.execute-api.us-west-1.amazonaws.com/${stageName}`));
}
function findApiName()
{
    const infoFile = path.join(projectPaths.functionPath, "apiService.info.json")
    const pkgFile =  projectPaths.packagePath;
    let pkg:any = {};
    if(fs.existsSync(pkgFile)) { pkg = JSON.parse(fs.readFileSync(pkgFile).toString()) }
    let info:any = {};
    if(fs.existsSync(infoFile)) { info = JSON.parse(fs.readFileSync(infoFile).toString()) }

    return info.title ?? pkg.name ?? "API";
}

function RemoveExistingVersions(client:APIGatewayClient)
{
    return new Promise(resolve => {
        const ourName = findApiName();
        // ClogDebug("looking for name "+ ourName)
        const listCommand = new GetRestApisCommand({})
        const all:any = [];
        client.send(listCommand).then((response:any) => {
            // ClogInfo(`There are ${response.items.length} other APIs`)


            const DeleteMatchingApis = (i: number = 0):Promise<any> => {
                if (i >= response.items.length) {
                    resolve(undefined);
                    return Promise.resolve(undefined);
                }
                const item = response.items[i];
                if (item.name === ourName) {
                    // ClogInfo(`Found previous ${ourName}, [${item.id}] -- deleting...`)
                    const deleteCommand = new DeleteRestApiCommand({
                        restApiId: item.id
                    })
                    return client.send(deleteCommand).then(() => {
                        delay(5000).then(() => {
                            console.log(ac.magenta.bold(`Removed previous id ${item.id}`));
                            return DeleteMatchingApis(++i);
                        })
                    })
                } else {
                    return DeleteMatchingApis(++i);
                }
            }
            DeleteMatchingApis();
        });
    })
}


class FunctionInfo {
    name: string = ""
    arn: string = ""
}
class APIInfo {
    id: string = ""
    parentId: string = ""
    path:string = ""
    pathPart: string = "";
    resourceMethods: object = {}
}


class PrereqInfo {
    requestApiId:string = ""
    functions: FunctionInfo[] = []
    apis: any[] = [] // Resource + method
    defs: any[] = []

    public findApi(pathMap:string, allowedMethods:string):any
    {
        // find the pathmap in the apis list
        // see that this method exists in method map
        for(let api of this.apis) {
            if (api?.path === pathMap) {
                // ClogTrace("resourceMethods", api.resourceMethods)
                const methodList = Object.getOwnPropertyNames(api.resourceMethods);
                // ClogTrace("methodList", methodList)
                for(let meth of allowedMethods.toUpperCase().split(',')) {
                    // ClogTrace("meth", meth)
                    if(methodList.indexOf(meth) !== -1) {
                        (api as any).method = meth
                        return api;
                    }
                }
            }
        }
        return null;
    }

    public findARN(name:string):string
    {
        for(let f of this.functions ?? []) {
            if(f.name.toLowerCase() === name.toLowerCase()) return f.arn;
        }
        return "";
    }

    public MakeRequests():PutIntegrationRequest[]
    {
        const region = "us-west-1"
        const out:PutIntegrationRequest[] = [];
        for(let d of this.defs) {
            const def = (d as any);
            const api = this.findApi(def.pathMap, def.allowedMethods)
            const arn = this.findARN(def.name)
            if(!arn) {
                console.log(`>>> No ARN for ${def.name} ${def.pathMap}, ${api.id}`)
            }
            if(api) {
                out.push({
                    restApiId: this.requestApiId,
                    resourceId: api.id, // api.parentId
                    httpMethod: api.method,
                    integrationHttpMethod: 'POST', // api.method,
                    type: "AWS_PROXY",
                    uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${arn}/invocations`,
                    credentials: "arn:aws:iam::545650260286:role/TBDLambdaExecution2"
                })
            }

        }
        return out;
    }
}


async function PrequisiteValues(id:string):Promise<PrereqInfo>
{
    const out = await GetFunctionInfo(new PrereqInfo())
    out.defs = gatherFunctionDefinitions()
    addBuiltInDefinitions(out.defs)
    out.requestApiId = id;
    await GetMethodResources(id, out);

    return out;
}

async function GetFunctionInfo(info:PrereqInfo):Promise<PrereqInfo>
{
    const client = new LambdaClient({});
    const listCommand:any = new ListFunctionsCommand({})
    const response:any = await client.send(listCommand);

    for(let func of response.Functions ?? []) {
        info.functions.push({
            name: func.FunctionName ?? "",
            arn: func.FunctionArn ?? ""
        })
    }
    return info;

}

async function GetMethodResources(id:string, info:PrereqInfo)
{
    const client = new APIGatewayClient({})
    const listCommand = new GetResourcesCommand({
        restApiId: id
    });
    const response = await client.send(listCommand);
    // ClogInfo("Resources response", response)
    if(response?.items) info.apis = response.items;

    return info;
}

async function PutIntegrations(integrations:PutIntegrationRequest[])
{
    const client = new APIGatewayClient({})
    for(let input of integrations) {

        try {
            const command = new PutIntegrationCommand(input);
            const intResp = await client.send(command);
            // ClogDebug("integration response", intResp);
            await delay(5000);
        } catch(e:any) {
            console.error("Problem with integration for "+input.uri, {input});
            throw e
        }
    }
}

async function DeployApi(restApiId:string, stageName:string)
{
    try {
        const client = new APIGatewayClient({})
        const command = new CreateDeploymentCommand({
            restApiId,
            stageName
        })
        const resp = await client.send(command);
    }
    catch(e:any) {
        console.error(ac.red.bold("Error with deployApi: "+e.message));
        throw e;
    }
}
