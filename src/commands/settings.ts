import path from 'path'
import fs from 'fs'
import { LiftConfig, RuntimeType } from '../lib/LiftConfig'
import { homedir } from 'os'
import { ask } from '../lib/askQuestion'
import * as ac from 'ansi-colors'

export async function doSettings (): Promise<number> {
  try {
    const mistLiftPath = path.join(homedir(), '.mistlift')
    let settings: LiftConfig = { cloudHost: 'AWS' }
    if (fs.existsSync(mistLiftPath)) {
      settings = JSON.parse(fs.readFileSync(mistLiftPath).toString())
    }

    let ok = false
    while (!ok) {
      settings.cloudHost = ask('Type of cloud host (AWS)',
        'cloud host',
        settings.cloudHost
      )
      ok = settings.cloudHost === 'AWS' // all we support now
    }
    ok = false

    if (settings.cloudHost === 'AWS') {
      ok = false
      console.log('Choose from a configured AWS profile, or leave empty to use a custom credentials config file')
      while (!ok) {
        settings.awsIniProfile = ask('Name of AWS profile to use',
          'AWS Profile',
          settings.awsIniProfile ?? 'default'
        )
        ok = settings.awsIniProfile !== ''
      }
      ok = false
      let runtime: string = settings.awsNodeRuntime as string
      while (!ok) {
        runtime = ask('AWS Node Runtime Version',
          'NodeJS Runtime',
          'Nodejs20.x'
        )
        ok = runtime !== ''
      }
      settings.awsNodeRuntime = runtime.toLowerCase() as RuntimeType

      ok = false
      while (!ok) {
        settings.awsPreferredRegion = ask('Preferred AWS region',
          'preferred AWS region',
          settings.awsPreferredRegion ?? 'us-east-1'
        )
        ok = (settings.awsPreferredRegion ?? '') !== ''
      }
      ok = false
      console.log('Supply the ARN for the service role you have created in your AWS IAM account for Lambda, S3, and Cloudwatch access')
      while (!ok) {
        settings.awsServiceRoleARN = ask('AWS service role ARN',
          'serviceRole ARN',
          settings.awsServiceRoleARN ?? 'arn:aws.iam::xxxxxxxxxxxx:role/service-role-name'
        )
        ok = settings.awsServiceRoleARN !== 'arn:aws.iam::xxxxxxxxxxxx:role/service-role-name' &&
                  settings.awsServiceRoleARN !== ''
      }
    }
    fs.writeFileSync(mistLiftPath, JSON.stringify(settings))

    return 0
  } catch (e: any) {
    console.error(ac.bold.red('Error with settings:'), e)
    return -1
  }
}
