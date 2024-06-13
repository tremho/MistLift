
import * as path from 'path'
import {resolvePaths} from "../pathResolve";
import {recurseDirectory} from "../DirectoryUtils";


export function GetWebrootServePaths(): string[]
{
    const projectPaths = resolvePaths();
    const webroot = path.join(projectPaths.basePath, "webroot")

    const list:string[] = [''];
    recurseDirectory(webroot, (filepath, stats) => {
        if(stats.isDirectory())
        {
            let relpath = filepath.substring(webroot.length);
            if(list.indexOf(relpath) === -1) list.push(relpath);
        }
    })
    return list;
}