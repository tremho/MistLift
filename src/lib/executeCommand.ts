
import { exec } from 'child_process'

interface StringObject {
  toString: () => string
}

export async function executeCommand (cmd: string, args: any[], cwd = '', consolePass = false, env: any = {}): Promise<any> {
  const out = {
    stdStr: '',
    errStr: '',
    retcode: 0
  }
  return await new Promise(resolve => {
    const cmdstr = cmd + ' ' + args.join(' ')
    // console.log('executing ', cmdstr, 'at', cwd)
    const opts = {
      cwd,
      env: Object.assign(env, process.env)
    }
    const proc = exec(cmdstr, opts)
    if (proc.stdout != null) {
      proc.stdout.on('data', (data: StringObject) => {
        out.stdStr += data.toString()
        if (consolePass) process.stdout.write(data.toString())
      })
    }
    if (proc.stderr != null) {
      proc.stderr.on('data', (data: StringObject) => {
        out.errStr += data.toString()
        if (consolePass) process.stdout.write(data.toString())
      })
    }
    proc.on('error', error => {
      console.error(error)
      if (out.errStr === '') out.errStr = error.message
      out.retcode = -1
      resolve(out)
    })
    proc.on('close', code => {
      out.retcode = code === null ? -1 : code
      resolve(out)
    })
  })
}
