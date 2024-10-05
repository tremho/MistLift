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

  const entryPoints = serverConfig.esbuild.entryPoints ?? []
  const outDir = serverConfig.esbuild.outdir ?? 'webroot'
  const watch = serverConfig.esbuild.watch ?? false
  // const breakOnError = serverConfig.esbuild.breakOnError ?? false
  // const breakOnWarn = serverConfig.esbuild.breakOnWarn ?? false

  // console.warn('running esbuild', { entryPoints, outDir, watch })

  const ctx = await esbuild.context({
    entryPoints,
    bundle: true,
    outdir: outDir
  })
  // console.log('esbuild...')

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
