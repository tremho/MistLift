
import {
    LambdaClient,
    CreateFunctionCommand,
    DeleteFunctionCommand,
    AddPermissionCommand
} from "@aws-sdk/client-lambda";

import md5 from "md5";

import path from "path"
import fs, {Stats} from "fs"
import {resolvePaths} from "../lib/pathResolve"

import * as ac from "ansi-colors"

import {doTestAsync} from  "./test"
import {recurseDirectory} from "../lib/DirectoryUtils"
import {getLiftVersion, getProjectName, getProjectVersion} from "../lib/LiftVersion"
import {executeCommand} from "../lib/executeCommand"
import {isNewerFile} from "../lib/fileCompare"
import {delay} from "../lib/utils"
import {doBuildAsync} from "./build";
import {doPackageAsync} from "./package";
import {Md5} from "@smithy/md5-js";

let projectPaths:{basePath: string, buildPath: string, functionPath: string, packagePath: string, verified: boolean}

let deploymentRecord:any = {} // a map of last deployment times

// package then deploy
export async function doDeployAsync(
    args:string[]
): Promise<number>
{
    projectPaths = resolvePaths()

    const deploymentRecordPath = path.join(projectPaths.basePath, '.deployed')
    try { deploymentRecord = JSON.parse(fs.readFileSync(deploymentRecordPath).toString()) } catch {}

    // the main package json that has all imports
    const mainPkgJsonPath = path.join(projectPaths.packagePath)
    const mainPkgSrc = fs.readFileSync(mainPkgJsonPath).toString()
    const mainPkgJson = JSON.parse(mainPkgSrc)

    const projectName = getProjectName()
    const projectVersion = getProjectVersion()
    const liftVersion = getLiftVersion()

    const funcsToDeploy: string[] = []
    const options: string[] = []
    for (let arg of args) {
        if (arg.charAt(0) == '-') {
            options.push(arg.toLowerCase())
        } else funcsToDeploy.push(arg)
    }

    if (options.indexOf("--no-package") === -1) {
        let ret = await doPackageAsync(args)
        if (ret) return ret;
        else await delay(2500);
    }

    if(options.indexOf("--clean") !== -1) {
        deploymentRecord = {};
    }

    if (!funcsToDeploy.length) {
        let firstDepth = 0
        recurseDirectory(projectPaths.functionPath, (filepath, stats) => {
            let depth = filepath.split(path.sep).length
            if (!firstDepth) firstDepth = depth
            if (stats.isDirectory() && depth == firstDepth) {
                funcsToDeploy.push(path.basename(filepath))
            }
        })
    }

    const all: Promise<any>[] = [];
    let error = 0;

    for (let funcName of funcsToDeploy) {
        // console.log("Deploy "+funcName)
        const zipFile = path.join(projectPaths.basePath, 'MistLift_Zips', funcName+".zip")
        if(fs.existsSync(zipFile)) {
            let zipTime = fs.statSync(zipFile).mtime;
            if(zipTime.getTime() > (deploymentRecord[funcName] ?? 0)) {
                await deployPackage(funcName);
                deploymentRecord[funcName] = Date.now();
            }
        } else {
            console.error("deploy: " +zipFile + ac.red.bold(` ${funcName} does not exist`))
            return -1;
        }
    }

    try {fs.writeFileSync(deploymentRecordPath, JSON.stringify(deploymentRecord)) } catch {}

    return 0;
}

//------------

export async function deployPackage(funcName:string, zipFile?:string) {
    // first off, anchor a base directory
    zipFile ??= path.join(projectPaths.basePath, 'MistLift_Zips', funcName+".zip")

    // funcname gets decorated with current instance identifier
    var idsrc = md5((getProjectName()??"") + (getProjectVersion()??""))
    var dFuncName = funcName + "_"+idsrc

    // See if function exists
    const emptyConfig:any = {}
    const client:any = new LambdaClient(emptyConfig);
    const command:any = new DeleteFunctionCommand({
        FunctionName: dFuncName
    });
    client.send(command).then((response:any) => {
    }).catch((e:any) =>  {
    });

    // console.log(ac.green.italic("deploying ")+ac.green.bold(funcName)+"...")

    try {
        const response:any = await CreateCloudFunction(dFuncName, zipFile);
        const parts = response.FunctionArn.split(":");
        const principal = parts[4]
        await AddPermissions(client, dFuncName, principal);
        console.log(ac.green.bold(`Successfully deployed ${funcName}`));
    }
    catch(e:any) {
        console.error(ac.red.bold.italic("Error deploying "+funcName), e);
    }
}
async function CreateCloudFunction(
    funcName:string,
    zipFile:string

) : Promise<any>
{

    const zipFileBase64:Uint8Array = fs.readFileSync(zipFile);
    const emptyConfig:any = {}
    const client:any = new LambdaClient(emptyConfig);
    const command:any = new CreateFunctionCommand({
        FunctionName: funcName,
        Runtime: 'nodejs18.x', // todo: to come from config or derived from package.json / discovery
        Role: 'arn:aws:iam::545650260286:role/tremho-services-role', // todo: to come from a config file
        Handler: 'runmain.handler',
        Code: {
            ZipFile: zipFileBase64
        }
    });
    return await client.send(command); // response
}

function AddPermissions(client:LambdaClient, funcName:string, principal:string):Promise<any>
{
    // TODO: from a config source
    const region = "us-west-1";
    const WSApi = "/"+funcName.toLowerCase();
    const command:any = new AddPermissionCommand({
        FunctionName: funcName,
        StatementId: "InvokePermission",
        Action: "lambda:invokeFunction",
        Principal: "apigateway.amazonaws.com",
        SourceArn: `arn:aws:execute-api:${region}:${principal}:${WSApi}`
    });
    return client.send(command);
}
