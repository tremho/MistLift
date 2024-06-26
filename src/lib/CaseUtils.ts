
// separate a case-joined string into a string of space-separated words
export function separated (
  instr: string
): string {
  let outstr = ''
  for (let i = 0; i < instr.length; i++) {
    const c = instr.charAt(i)
    if (!isAlphaNum(c) || isUpperCase(c)) {
      outstr += ' '
    }
    outstr += c.toLowerCase()
  }

  return outstr.trim()
}

function isUpperCase (instr: string): boolean {
  return instr?.toUpperCase() === instr
}
function isAlphaNum (char: string): boolean {
  let alnum = false
  const cc = char.toUpperCase().charCodeAt(0)
  if (cc >= 'A'.charCodeAt(0) && cc <= 'Z'.charCodeAt(0)) alnum = true
  if (cc >= '0'.charCodeAt(0) && cc <= '9'.charCodeAt(0)) alnum = true
  return alnum
}

export function camelCase (
  instr: string
): string {
  const seps = separated(instr).split(' ')
  for (let i = 1; i < seps.length; i++) {
    seps[i] = seps[i].charAt(0).toUpperCase() + seps[i].substring(1)
  }
  return seps.join('')
}

export function pascalCase (
  instr: string
): string {
  const seps = separated(instr).split(' ')
  for (let i = 0; i < seps.length; i++) {
    seps[i] = seps[i].charAt(0).toUpperCase() + seps[i].substring(1)
  }
  return seps.join('')
}

export function snakeCase (
  instr: string
): string {
  return dashCase(instr, '_')
}
export function dashCase (
  instr: string,
  dashChar: string = '-',
  allCaps: boolean = false
): string {
  const seps = separated(instr).split(' ')
  let out = seps.join(dashChar)
  if (allCaps) out = out.toUpperCase()
  return out
}
