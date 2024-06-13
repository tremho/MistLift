/** Handles the input the user must supply upon init
 */

import * as path from 'path'
import * as fs from 'fs'
import {executeCommand} from "../../lib/executeCommand";
import {ask} from "../../lib/askQuestion"

export async function interrogateUserForPackageJsonSettings(
    projectPath:string
)
{
    // get existing package.json or {}
    // name of project - module name, display name, short name
    // description
    // set version
    // gitAuthor ?? Author
    // create a repository under gitAuthor?
    // copyright
    // spdx licence

    const gitAuthor = await findGitAuthor()
    const pkgJson = existingPackageJson(projectPath)
    let name = pkgJson.name ?? nameFromProjectPath(projectPath);
    let version = pkgJson.version ?? "0.1.0-prerelease.1"
    let description = pkgJson.description ?? ""
    let author = pkgJson.author ?? gitAuthor
    let copyright = pkgJson.copyright ?? defaultCopyright(author)
    let spdx = pkgJson.license ?? "NO LICENSE"


    let ok = false;
    while(!ok) {
        name = ask("Module name of this project",
            "module name",
            name
        )
        ok = name && name.indexOf(' ') === -1
    }
    ok = false
    while(!ok) {
        version = ask("Project version. Use prerelease suffix for development versions. Use Semantic Versioning (https://semver.org).",
            "version",
            version ?? "0.1.0-prerelease.1"
        )
        ok = version && version.indexOf('.') !== -1
    }
    ok = false
    while(!ok) {
        description = ask("Give a brief description of what this project does / what it is for",
            "description",
            description ?? ""
        )
        ok = description !== "";
    }
    ok = false
    while(!ok) {
        author = ask("Identify yourself as the author of this project",
            "name",
            author
        )
        ok = author !== "";
    }
    ok = false
    while(!ok) {
        copyright = ask("Specify a displayable copyright notice",
            "Copyright",
            copyright
        )
        ok = copyright !== ""
    }
    ok = false
    while(!ok) {
        spdx = ask("Specify the appropriate SPDX license identifier for this project. See https://spdx.org/licenses/ for more info.",
            "spdx identifier",
            spdx
        )
        ok = spdx !== ""
    }


    pkgJson.name = name
    pkgJson.version = version
    pkgJson.description = description
    pkgJson.author = author
    pkgJson.copyright = copyright
    pkgJson.license = spdx

    const pkgPath = path.join(projectPath, "package.json");
    fs.writeFileSync(pkgPath,
        JSON.stringify(pkgJson, null, 2))

}

async function findGitAuthor() {
    return executeCommand('git', ['config', '--get', 'user.name']).then(rt => {
        let name = ''
        if(rt.retcode) {
            console.error('Error '+rt.retcode, rt.errStr)
        } else {
            name = rt.stdStr.trim().toLowerCase()
        }
        return name
    })

}

function defaultCopyright(name:string) {
    return `(C) ${new Date(Date.now()).getFullYear()} ${name}. All rights reserved.`
}

function nameFromProjectPath(refPath:string)
{
    const n = refPath.lastIndexOf('/')+1;
    return refPath.substring(n)
}

function existingPackageJson(refPath:string):any
{
    let packageJson:any = {};
    const pkgPath = path.join(refPath, "package.json");
    if(fs.existsSync((pkgPath))) {
        try {
            packageJson = JSON.parse(fs.readFileSync(pkgPath).toString());
        }
        catch(e:any) {
            // error in existing package.json.  Please fix or remove and try again.
        }
    }
    return packageJson;
}