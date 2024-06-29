import * as fs from 'fs'
import * as path from 'path'
import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'
import { helpInfo } from './help'
import {getProjectName} from "../lib/LiftVersion";

/// Info command
export function doInfo (
): void {
    const projectName = getProjectName()
    const projectPaths = resolvePaths()

    const publishedFile = path.join(projectPaths.basePath, '.published')
    let publishedInfo = {url:'', time:0}
    try {
        if (fs.existsSync(publishedFile)) {
            publishedInfo = JSON.parse(fs.readFileSync(publishedFile).toString())
        }
    } catch (e) {
    }
    const deployedFile = path.join(projectPaths.basePath, '.deployed')
    let deployedInfo:any = {}
    try {
        if (fs.existsSync(deployedFile)) {
            deployedInfo = JSON.parse(fs.readFileSync(deployedFile).toString())
        }
    } catch (e) {
    }
    if(publishedInfo.url === '') {
        console.log(ac.bold.magenta(`${projectName} is not yet published`))
    } else {
        const publishedUrl = publishedInfo.url
        const when = new Date(publishedInfo.time)
        console.log(ac.green.bold(`${projectName} Last published to ${publishedUrl} at ${when}`))
        for (const depName of Object.getOwnPropertyNames(deployedInfo)) {
            const depTime = deployedInfo[depName] ?? 0
            if(depTime > 0 && depTime < publishedInfo.time) {
                console.log('    '+ac.blue.bold(depName))
            }
        }
    }
}