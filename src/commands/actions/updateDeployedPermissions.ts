import * as ac from 'ansi-colors'

import path from "path";
import fs from "fs";
import { recurseDirectory } from '../../lib/DirectoryUtils'
import {decoratedName, getAccountId} from '../../lib/IdSrc'
import {getAWSCredentials, getSettings} from '../../lib/LiftConfig'
import {resolvePaths} from "../../lib/pathResolve";
import {LambdaClient, AddPermissionCommand} from "@aws-sdk/client-lambda";

let projectPaths: { basePath: string, buildPath: string, functionPath: string, packagePath: string, verified: boolean }


export default async function updateDeployedPermissions(apiId:string) {
    const projectPaths = resolvePaths()
    if (!projectPaths.verified) {
        console.log(ac.bold.magenta('current directory is not at project root'))
        return -1
    }

    const funcsToDeploy: string[] = []
    let firstDepth = 0
    recurseDirectory(projectPaths.functionPath, (filepath, stats) => {
        const depth = filepath.split(path.sep).length
        if (firstDepth === 0) firstDepth = depth
        if (stats.isDirectory() && depth === firstDepth) {
            funcsToDeploy.push(path.basename(filepath))
        }
        return false
    })

    const accountId:string = await getAccountId()
    const region:string = getSettings().awsPreferredRegion ?? ''

    const client = new LambdaClient(getAWSCredentials())

    for (const funcName of funcsToDeploy) {

        // read the def file and get the method from there
        const defPath = path.join(projectPaths.functionPath, funcName, 'src', 'definition.json')
        const def = JSON.parse(fs.readFileSync(defPath).toString())
        const method:string = def.method
        const pathMap:string = def.pathMap

        const arn = generateSourceArnForApiGateway(region, accountId, apiId, method, pathMap)
        const dname = decoratedName(funcName)
        console.log(ac.grey.italic('update permissions for resource '+arn))
        const command: any = new AddPermissionCommand({
            FunctionName: dname,
            StatementId: 'InvokePermission',
            Action: 'lambda:invokeFunction',
            Principal: 'apigateway.amazonaws.com',
            SourceArn: arn
        })
        const resp = await client.send(command)

    }


}

/**
 * Generates the correct SourceArn to authorize API Gateway to invoke a Lambda function.
 *
 * @param region - The AWS region, e.g., 'us-west-1'
 * @param accountId - Your AWS account ID
 * @param apiId - The API Gateway ID, e.g., 'sfr7yltmc3'
 * @param method - The HTTP method, e.g., 'POST'
 * @param routePath - The API route path, e.g., '/upstart/{artistId}/{id}'
 * @returns The complete SourceArn string
 */
export function generateSourceArnForApiGateway(
    region: string,
    accountId: string,
    apiId: string,
    method: string,
    routePath: string
): string {
    // Clean leading slashes and replace path params with wildcards
    const cleanedPath = routePath
        .replace(/^\/+/, '') // remove leading slashes
        .replace(/{[^}]+}/g, '*') // replace path params with *

    return `arn:aws:execute-api:${region}:${accountId}:${apiId}/*/${method.toUpperCase()}/${cleanedPath}`
}
