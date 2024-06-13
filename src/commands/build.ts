/** handles building in the project directory */

import * as path from 'path'
import * as fs from 'fs'
import * as ac from "ansi-colors"
import {resolvePaths} from "../lib/pathResolve";
import {recurseDirectory} from "../lib/DirectoryUtils";
import {helpBuild} from "./help"
import {isNewer} from "../lib/fileCompare";
import {executeCommand} from "../lib/executeCommand";
import {buildOpenApi} from "../lib/openAPI/openApiConstruction";
import {gatherFunctionDefinitions} from "../lib/openAPI/ApiBuildCollector";
import {delay} from "../lib/utils"
import {mkdirSync} from "fs";


// Build command
export async function doBuildAsync(
    args:string[] // zero or more functions to build.  zero means build all
): Promise<number>
{
    const projectPaths = resolvePaths()
    const funcsToBuild:string[] = []
    const options:string[] = []
    for (let arg of args) {
        if(arg.charAt(0) == '-') {
            options.push(arg.toLowerCase())
        }
        else funcsToBuild.push(arg)
    }

    if(!funcsToBuild.length)
    {
        let firstDepth = 0
        recurseDirectory(projectPaths.functionPath, (filepath, stats) => {
            let depth = filepath.split(path.sep).length
            if(!firstDepth) firstDepth = depth
            if(stats.isDirectory() && depth == firstDepth) {
                funcsToBuild.push(path.basename(filepath))
            }
        })
    }

    let fails = 0;
    let failFast = options.indexOf("--failfast") !== -1
    if(options.indexOf("--deferfail") !== -1) failFast = false
    for(let func of funcsToBuild) {
        const funcDir = path.join(projectPaths.functionPath, func);
        if(fs.existsSync(funcDir)) {
            fails += await buildSingleFunction(funcDir, options);
            if(fails && failFast) break;
        } else {
            console.log(ac.red.bold(`${func} does not exist as a function`))
            fails++;
            if(failFast) break;
        }
    }
    return fails
}

async function buildSingleFunction(funcDir:string, options:string[]):Promise<number> {
    const funcName = funcDir.substring(funcDir.lastIndexOf('/')+1);
    const buildPath = path.normalize(path.join(funcDir, '..', '..', 'build', 'functions', funcName));
    if(options.indexOf('--clean') !== -1) {
        if(fs.existsSync(buildPath)) {
            fs.rmSync(buildPath, {recursive: true})
        }
    }
    // strategy here is to invoke tsc on a per-folder basis rather than letting tsc do the recurse because it is easier to control this way
    return await buildFunctionModules(funcName, funcDir, buildPath, options)

}
async function buildFunctionModules(
    funcName:string,
    funcDir:string,
    buildPath:string,
    options: string[]

) : Promise<number>
{
    const announce = ac.blue.dim(`building ${funcName}...`)
    let announced = false
    let fails = 0;
    let builds = 0;
    let failFast = options.indexOf("--failfast") !== -1
    if(options.indexOf("--deferfail") !== -1) failFast = false
    const all:Promise<void>[] = [];
    recurseDirectory(funcDir, (filepath, stats) => {
        if(path.extname(filepath) === ".ts") {
            let relPath = filepath.substring(funcDir.length);
            relPath = relPath.substring(0, relPath.lastIndexOf('/'));
            let outDir = path.join(buildPath, relPath);
            // console.log(`tsc --esModuleInterop true --outdir ${outDir} ${filepath}`);
            if(!(fails && failFast)) {
                if (isNewer(filepath, outDir)) {
                    if (!announced) {
                        announced = true
                        console.log(announce)
                    }
                    builds++;
                    all.push(executeCommand('tsc', [
                        '--esModuleInterop', 'true',
                        '--target', 'ES2015',
                        '--module', 'commonjs',
                        '--lib', 'dom,es2015,scripthost,es2015.proxy',
                        '--strict', 'true',
                        '--noImplicitAny', 'false',
                        '--skipLibCheck', 'true',
                        '--forceConsistentCasingInFileNames', 'true',
                        '--sourceMap', 'true',
                        '--outdir', outDir,
                        filepath
                    ], '', true).then(result => {
                        if (result.retcode) {
                            fails++
                            // console.log("error detected", fails)
                            const now = new Date()
                            fs.utimesSync(filepath, now, now) // touch file so it is not skipped next build
                        }
                    }))
                }
            }
        }
    })
    return Promise.all(all).then( async () => {
        fails += await doPostBuildSteps(funcDir, buildPath)
        return fails
    })
}

async function doPostBuildSteps(funcDir: string, buildPath: string) : Promise<number>
{
    // copy the definitions,json file over
    const srcdef = path.join(funcDir, 'src', 'definition.json')
    const dstdef = path.join(buildPath, 'src', 'definition.json')
    if(fs.existsSync(srcdef)) {
        fs.copyFileSync(srcdef, dstdef)
    } else {
        console.error(ac.red.bold("no definition file found at "+srcdef));
        return 1;
    }
    // copy the __files__ folder if it exists
    const filedirPath = path.join(funcDir, "__files__");
    if(fs.existsSync(filedirPath)) {
        const bfiles = path.join(buildPath, '__files__');
        if(!fs.existsSync(bfiles)) fs.mkdirSync(bfiles, {recursive:true});
        recurseDirectory(filedirPath, (filepath, stats) =>{
            let relPath = filepath.substring(funcDir.length);
            relPath = relPath.substring(0, relPath.lastIndexOf('/'));
            let outDir = path.join(buildPath, relPath);
            let target = path.join(outDir, path.basename(filepath));
            if(stats.isDirectory() && !fs.existsSync(target)) {
                fs.mkdirSync(target, {recursive: true});
            }
            if(stats.isFile()) {
                fs.copyFileSync(filepath, target);
            }
        })
    }
    return 0
}




