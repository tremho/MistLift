
import { getProjectName, getProjectVersion } from '../lib/LiftVersion'
import sha1 from 'sha1'

export function getIdDelimiter (): string {
  return '_-_'
}
export function getIdSrc (): string {
  let idsrc = '' + (getProjectName() ?? '') + '__v' + (getProjectVersion()?.toString() ?? '')
  while (idsrc.includes(' ')) idsrc = idsrc.replace(' ', '_')
  while (idsrc.includes('.')) idsrc = idsrc.replace('.', '-')

  return idsrc
}
export function decoratedName (name: string): string {
  if (name.includes(getIdDelimiter())) {
    // console.warn('name '+name+' appears to be decorated already')
    return name
  }

  while (name.includes('/')) name = name.replace('/', '')

  const hash8 = sha1(name.toLowerCase()).toString().substring(0, 8)

  const fullName = name + getIdDelimiter() + getIdSrc()
  let dname
  if (name.startsWith('fileserve_')) {
    dname = ('fileServe_' + hash8 + getIdDelimiter() + getIdSrc()).substring(0, 64)
  } else {
    dname = fullName.substring(0, 50) + '_' + hash8
  }
  // console.warn('decorated to '+dname+' from '+name)
  return dname
}
