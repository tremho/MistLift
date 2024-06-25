
import * as ac from "ansi-colors"
import {VersionInfo, getLiftVersion, getProjectVersion, getProjectName} from "../lib/LiftVersion";
import {executeCommand} from "../lib/executeCommand"
import {resolvePaths} from "../lib/pathResolve";
import {areSettingsAvailable} from "../lib/LiftConfig";

export async function doDoctor():Promise<boolean>
{
    console.log(ac.blue.bold('Lift doctor'));

    const liftVersion = getLiftVersion().toString()
    const projectVersion = getProjectVersion().toString()
    const projectName = getProjectName();
    const typescriptVersion = await fetchTypescriptVersion()
    const nodeVersion = await fetchNodeVersion()
    const npmVersion = await fetchNpmVersion()
    const gitVersion = await fetchGitVersion();
    const settingsAvail = areSettingsAvailable();

    console.log("Checking installed dependencies:")
    let ok = report("MistLift", liftVersion, "0.1.0")
    ok = ok && report("Typescript", typescriptVersion, "5.3.3")
    ok = ok && report("Node", nodeVersion, "20.11.0")
    ok = ok && report("Npm", npmVersion, "10.3.0")
    report("Git", gitVersion, "2.0.0")
    if(!settingsAvail) {
        console.log("")
        console.log(ac.yellow.dim.bold("Cloud Settings are not set. ")+ac.blue("run "+ac.bold("lift settings")))
    }
    if(!ok) {
        console.log("")
        console.log(ac.red.bold("System needs updates before MistLift can be used."));
    } else {
        console.log("")
        console.log(ac.green.bold("Ready for MistLift"))
        console.log("");
        if(resolvePaths().verified) {
            console.log(ac.blue.italic("Current project " + projectName + " " + projectVersion))
        }
    }
    return ok
}

function versionTrim(vstr:string)
{
    vstr = vstr.trim();
    let i = -1;
    while(++i < vstr.length) {
        let c = vstr.charAt(i);
        if(c >= '0' && c <= '9') break;
    }
    return vstr.substring(i);
}

async function fetchTypescriptVersion()
{
    const result = await executeCommand('tsc', ['-v'])
    if(result.retcode) return "Typescript not found"
    var vstr = versionTrim(result.stdStr);
    return vstr;
}

async function fetchNodeVersion()
{
    const result = await executeCommand('node', ['-v'])
    if(result.retcode) return "Node not found"
    var vstr = versionTrim(result.stdStr);
    return vstr;

}

async function fetchNpmVersion()
{
    const result = await executeCommand('npm', ['-v'])
    if(result.retcode) return "npm not found"
    var vstr = versionTrim(result.stdStr);
    return vstr;
}

async function fetchGitVersion()
{
    const result = await executeCommand('git', ['-v'])
    if(result.retcode) return "Git not found"
    var vstr = versionTrim(result.stdStr);
    return vstr;
}

// compare to a minimum and report ok or error

function report(name:string, version:string, minStr:string):boolean
{
    const ver = new VersionInfo(version);
    const minVer = new VersionInfo(minStr);
    let ok = (ver.isGreaterThan(minVer) || ver.equals(minVer))
    if(ok) {
        console.log(ac.green.bold("√ ")+ac.black.bold(name)+" "+ac.grey(version))
    } else {
        console.log(ac.red.bold("X ")+ac.black.bold(name)+ac.red.bold(" does not meet minimum version of ")+ac.blue(minStr))
    }
    return ok;
}