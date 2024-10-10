
import { getProjectName, getProjectVersion } from '../lib/LiftVersion'

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
  return name + getIdDelimiter() + getIdSrc()
}
