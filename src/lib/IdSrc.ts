
import { getProjectName, getProjectVersion } from '../lib/LiftVersion'
import sha1 from 'sha1'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

export function getIdDelimiter (): string {
  return '_-_'
}
export function getIdSrc (): string {
  let idsrc = '' + (getProjectName() ?? '') + '__v' + (getProjectVersion()?.toString() ?? '')
  while (idsrc.includes(' ')) idsrc = idsrc.replace(' ', '_')
  while (idsrc.includes('.')) idsrc = idsrc.replace('.', '-')

  const projectHash = sha1(idsrc).toString().substring(0, 8)
  // console.log("project hash", {idsrc, projectHash})
  idsrc = getProjectName() + '_' + projectHash
  // console.log("idsrc is "+idsrc)
  return idsrc
}
export function decoratedName (name: string): string {
  if (name.includes(getIdDelimiter()) && name.includes(getIdSrc())) {
    // console.warn('name '+name+' appears to be decorated already')
    return name
  }

  while (name.includes('/')) name = name.replace('/', '')

  const hash8 = sha1(name.toLowerCase()).toString().substring(0, 8)

  const fullName = name + getIdDelimiter() + '_' + getIdSrc()
  // console.log("fullname is "+fullName)
  let dname
  if (name.startsWith('fileserve_')) {
    dname = ('fileServe_' + hash8 + getIdDelimiter() + '_' + getIdSrc()).substring(0, 64)
  } else {
    dname = fullName // .substring(0, 50) + '_' + hash8
  }
  // console.warn('decorated to '+dname+' from '+name)
  return dname
}

export async function getAccountId () {
  const client = new STSClient({} as any)
  const command: any = new GetCallerIdentityCommand({})
  const response: any = await client.send(command)
  return response.Account // This is your AWS account ID
}
