
import path from "path"
import fs, {Stats} from "fs"
import {resolvePaths} from "../lib/pathResolve"

import * as ac from "ansi-colors"

import {doTestAsync} from  "./test"
import {recurseDirectory} from "../lib/DirectoryUtils"
import {getLiftVersion, getProjectName, getProjectVersion} from "../lib/LiftVersion"
import {executeCommand} from "../lib/executeCommand"
import {isNewerFile} from "../lib/fileCompare"
import {delay, FolderToZip} from "../lib/utils"
import {doBuildAsync} from "./build";
import {runMain} from "tap";

// test then package
export async function doPackageAsync(
    args:string[]
): Promise<number> {

    const projectPaths = resolvePaths()
    const workPath = path.join(projectPaths.basePath, '.package_temp')

    if (fs.existsSync(workPath)) fs.rmSync(workPath, {recursive: true})
    fs.mkdirSync(workPath)

    const buildFunctionsPath = path.join(projectPaths.buildPath, 'functions')


    const funcsToPackage: string[] = []
    const options: string[] = []
    for (let arg of args) {
        if (arg.charAt(0) == '-') {
            options.push(arg.toLowerCase())
        } else funcsToPackage.push(arg)
    }

    let ret = await doBuildAsync(args)
    if (ret) return ret;

    if (!funcsToPackage.length) {
        let firstDepth = 0
        recurseDirectory(buildFunctionsPath, (filepath, stats) => {
            let depth = filepath.split(path.sep).length
            if (!firstDepth) firstDepth = depth
            if (stats.isDirectory() && depth == firstDepth) {
                funcsToPackage.push(path.basename(filepath))
            }
        })
    }

    const all: Promise<any>[] = [];
    let error = 0;

    for (let funcName of funcsToPackage) {
        all.push(packageFunction(funcName))
    }
    return Promise.all(all).then(() => {
        return error;
    })
}

async function packageFunction(funcName:string)
{
    const projectPaths = resolvePaths()
    const buildFunctionsPath = path.join(projectPaths.buildPath, 'functions')
    const all:Promise<any>[] = [];
    let error = 0;
    let funcPath = path.join(buildFunctionsPath, funcName);
    if (!fs.existsSync(funcPath)) {
        console.error(ac.red.bold(`${funcName} does not exist`) + ", cannot package");
        return -1;
    }
    const zipdir = path.join(projectPaths.basePath, 'MistLift_Zips')
    const zipFile = path.join(zipdir, funcName + '.zip')

    if (!fs.existsSync(zipdir)) {
        fs.mkdirSync(zipdir)
    }
    let zfx = fs.existsSync(zipFile)
    if (!zfx) {
    } else {
        if (!isNewerFile(funcPath, zipFile, ".js", ".zip")) {
            return 0;
        }
    }
    if (zfx) fs.unlinkSync(zipFile)

    const projectName = getProjectName()
    const projectVersion = getProjectVersion()
    const liftVersion = getLiftVersion()

    // the main package json that has all imports
    const mainPkgJsonPath = path.join(projectPaths.packagePath)
    const mainPkgSrc = fs.readFileSync(mainPkgJsonPath).toString()
    const mainPkgJson = JSON.parse(mainPkgSrc)
    const workPath = path.join(projectPaths.basePath, '.package_temp')

    console.log(ac.green.italic("packaging ") + ac.green.bold(funcName));

    // make a nominal package.json
    const pkgjson = {
        name: funcName,
        description: "Lambda function " + funcName + " for " + projectName + ", created with MistLift " + liftVersion,
        version: projectVersion,
        main: "runmain.mjs",
        scripts: {
            test: "echo \"No Tests Defined\" && exit 1"
        },
        dependencies: {},
        keywords: [],
        author: "",
        license: "ISC"
    }
    // find all the imports in the sources
    const imports = findAllImports(funcPath);
    pkgjson.dependencies = reconcileVersionImports(imports, mainPkgJson);
    //  - write out new package.json to workPath
    // console.log("writing package.json", pkgjson)
    fs.writeFileSync(path.join(workPath, 'package.json'), JSON.stringify(pkgjson, null, 2))
    //  - execute npm i at workpath, create node_modules
    all.push(executeCommand('npm i', [], workPath).then(() => {
        // copy the lambda function
        recurseDirectory(funcPath, (filepath: string, stats: Stats) => {
            if (filepath.substring(0, funcPath.length) == funcPath) {
                const endpath = filepath.substring(funcPath.length)
                if (endpath.toLowerCase().indexOf(`${funcName}-tests`.toLowerCase()) === -1) { // skip tests
                    const fromPath = path.join(funcPath, endpath);
                    const toPath = path.join(workPath, endpath)
                    if (stats.isDirectory() && !fs.existsSync(toPath)) {
                        fs.mkdirSync(toPath)
                    }
                    if(stats.isFile()) {
                        fs.copyFileSync(fromPath, toPath)
                    }
                }
            }
        })

        // put a runmain.mjs into place
        const templatePath = path.join(__dirname, '..', '..', 'templateData', 'function-runmain-mjs')
        const runmainPath = path.join(workPath, 'runmain.mjs')
        fs.writeFileSync(runmainPath, fs.readFileSync(templatePath));

        // ClogInfo("Zipping...")
        all.push(FolderToZip( workPath, zipFile ));
        // console.log("now zip it")
    }))

    return Promise.all(all).then(() => {
        // remove temp folder when done
        fs.rmSync(workPath, {recursive: true})
        return error
    })
}

function findAllImports(folder:string) {
    const imports:string[] = []
    if(fs.existsSync(folder))
    {
        recurseDirectory(folder, (filepath, stats) => {
            // console.log(`filepath = ${filepath}`);
            if(filepath.indexOf("__files__") == -1) {
                if (!stats.isDirectory()) { // TODO: maybe limit to .ts files?
                    const content = fs.readFileSync(filepath).toString();
                    for (const m of findImports(content)) {
                        // console.log('  import', m)
                        imports.push(m)
                    }
                }
            }
        })
    }
    return imports
}

function findImports(content:string) {
    const imports:string[] = []
    const regexp = /require\s*\(\s*["|'](.+)["|']/gm
    const matches = content.matchAll(regexp)
    for(const m of matches) {
        imports.push(m[1])
    }
    return imports
}

function reconcileVersionImports(imports:string[], mainPkgJson:any) {
    const dependencies = mainPkgJson.dependencies ?? {};
    const devDependencies = mainPkgJson.devDependencies ?? {};

    const builtins = [
        "fs",
        "path",
        "process",
        "crypto",
        "http"
    ]

    const depsOut:any = {}

    for(let m of imports) {
        let isDev = false;
        let r = dependencies[m]
        if(!r) {
            isDev = true;
            r = devDependencies[m]
        }
        if(r) {
            // TODO: check version map to insure we didn't shift versions
            if(depsOut[m] && depsOut[m] !== r) {
                console.error(ac.red.bold(`  Version mismatch on ${m}: ${r} vs ${depsOut[m]}`))
            }
            if(isDev) {
                console.error(ac.magenta(`  ${m} import is dev-only, not migrated`))
            } else {
                if(!depsOut[m]) console.log(ac.blue.dim(`  ${m} exported as ${r}`))
                depsOut[m] = r;
            }
        } else {
            // if not a builtin and not local..
            if(builtins.indexOf(m) === -1) {
                if (m.charAt(0) !== '.') {
                    console.error(ac.red.bold("  ERROR - Found no dependency reference for import"), m)
                }
            }
        }
    }
    return depsOut;
}