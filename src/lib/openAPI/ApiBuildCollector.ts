/**
 * Part 1 of two steps to build openApi docs.
 * This reads values from our "definitions.json" format and creates a single array that step 2 will turn into
 * openApi specifications.
 */
import fs from 'fs'
import path from 'path'
import {recurseDirectory} from "../DirectoryUtils";
import {resolvePaths} from "../pathResolve";


export function gatherFunctionDefinitions():any[] {
    const defs:any = []
    try {
        const projectPaths = resolvePaths();
        if(!projectPaths.verified) return [];
        const funcNames: string[] = [];
        if(!fs.existsSync(projectPaths.functionPath)) return [];
        let firstDepth = 0;
        recurseDirectory(projectPaths.functionPath, (filepath, stats) => {
            if (stats.isDirectory()) {
                let depth = filepath.split(path.sep).length
                if(!firstDepth) firstDepth = depth
                if(firstDepth == depth) {
                    funcNames.push(path.basename(filepath));
                }
            }
        })
        if(projectPaths.functionPath.indexOf('functions') !== -1 ) {
            for (let name of funcNames) {
                let defPath = path.join(projectPaths.functionPath, name, 'src', 'definition.json')
                if (fs.existsSync(defPath)) {
                    const content = fs.readFileSync(defPath).toString()
                    let buildPath = path.join(projectPaths.buildPath, 'functions', name, 'src', 'definition.json')
                    // fs.writeFileSync(buildPath, content); // use this opportunity to copy to build folder before we use it.
                    defs.push(JSON.parse(content))
                } else {
                    console.error(`Definition file not found at ${defPath}`);
                    return [];
                }
            }
        }
    } catch(e: any) {
        console.error("Exception in ApiBuildCollector", e)
    }
    return defs;
}
