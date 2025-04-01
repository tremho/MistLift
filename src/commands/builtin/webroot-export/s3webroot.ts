import { S3Client } from '@aws-sdk/client-s3'
import { s3ListObjects, s3CreateBucket, s3UploadFile, s3Delete, S3ActionsLog } from '@tremho/basic-s3-actions'
import * as fs from 'fs'
import * as ac from 'ansi-colors'
import { WebrootS3Options, WebrootScriptOptions } from '../ExportWebroot'
import {DeployRootFileserves, DeployWebrootBuiltIn} from "../BuiltInHandler";

export async function exportWebrootToS3 (exportFileList: string[], options?: WebrootS3Options) {
  const bucketName = determineBucketName()
  console.log(ac.green.bold('webroot export to s3 bucket name ' + bucketName))
  let existing: string[] = []
  try {
    // console.log("fetching existing")
    existing = await getExistingDeployedFileList(bucketName)
  } catch (e: any) {
    console.log(ac.blue.italic('creating webroot bucket ' + bucketName))
    await s3CreateBucket(bucketName, true)
    // console.log("bucket created")
  }

  console.log(ac.blue.italic("Deploying base webroot handling"))
  await DeployWebrootBuiltIn(true)
  await DeployRootFileserves()


  // console.log("existing ", existing)

  let update = false
  for (let file of exportFileList) {
    update = (file.charAt(0) == '+')
    if (update) file = file.substring(1)
    const i = file.indexOf('/webroot/') + 9
    const sfile = file.substring(i)
    if (!sfile) continue
    if(sfile.substring(0,4) === 'docs') continue // keep these in self-serve only
    const xi = existing.indexOf(sfile)
    let disp = 'created'
    if (xi !== -1) {
      existing.splice(xi, 1)
      disp = 'updated'
    }
    if (update) {
      // console.log(sfile+"...")
      try {
        await s3UploadFile(bucketName, file, sfile)
        console.log(ac.green.italic(`${disp} ${sfile}`))
      } catch (e: any) {
        break
      }
    }
  }
  for (const leftover of existing) {
    await s3Delete(bucketName, leftover)
    console.log(ac.green.italic(`deleted ${leftover}`))
  }
}

function determineBucketName () {
  let pkg: any = {}
  try {
    pkg = JSON.parse(fs.readFileSync('./package.json').toString())
  } catch (e: any) {
    console.error(ac.bold.red('Failed to read package.json ' + e.message))
  }
  return (pkg.author + '-' + pkg.name).toLowerCase()
}

async function getExistingDeployedFileList (bucketName: string) {
  // S3ActionsLog.setMinimumLevel('Console', 'trace')
  // S3ActionsLog.Debug("Getting bucket list for "+bucketName)
  const list = await s3ListObjects(bucketName)
  // S3ActionsLog.setMinimumLevel('Console', 'error')
  return list
}

export function getS3Prefix () {
  const name = determineBucketName()
  return `https://${name}.s3.us-west-1.amazonaws.com/`
}
