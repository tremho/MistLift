import * as esbuild from 'esbuild'
import { resolvePaths } from './pathResolve'
import path from 'path'
import fs from 'fs'

const serverConfig = readServerConfig()

export async function esbuilder (triggerRebuild: any = null, oneShot: boolean = true): Promise<void> {
  // console.warn('esbuilder starting...')
  if (serverConfig.esbuild === undefined && typeof triggerRebuild === 'function') {
    const promise: Promise<void> = triggerRebuild()
    return await promise // forces real start
  }

  const entryPoints = serverConfig.esbuild?.entryPoints ?? []
  const outDir = serverConfig.esbuild?.outdir ?? 'webroot'
  const watch = serverConfig.esbuild?.watch ?? false
  // const breakOnError = serverConfig.esbuild.breakOnError ?? false
  // const breakOnWarn = serverConfig.esbuild.breakOnWarn ?? false

  // console.warn('running esbuild', { entryPoints, outDir, watch })

  const options: any = serverConfig.esbuild  ?? {} // get all the config from the user they want
  // enforce the ones we need that may have been given defaults
  delete options.watch // not a real config
  options.entryPoints = entryPoints
  if (options.bundle === undefined) options.bundle = true
  options.outdir = outDir

  const ctx = await esbuild.context(options)
  // console.log('esbuild...', {ctx})

  /* let result = */ await ctx.rebuild()
  let more: boolean = watch === true
  do {
    await sleep(500)
    // console.log("ctx.rebuild()")
    /* result = */ await ctx.rebuild()
    more = watch === true
    if (oneShot) break
  } while (more)
  // console.log("done building")
}

export function readServerConfig (): any {
  // console.log('readServerConfig...')
  const projectPaths = resolvePaths()
  const confFile = path.join(projectPaths.basePath, 'localServerConfig.json')
  if (!fs.existsSync(confFile)) return {}

  const conf: any = JSON.parse(fs.readFileSync(confFile).toString())
  // console.log("server configuration", conf)
  return conf
}

async function sleep (ms: number): Promise<void> {
  return await new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
