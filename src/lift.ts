#!/usr/bin/env node

import * as ac from 'ansi-colors'
import * as process from 'process'

import {getLiftVersion} from "./lib/LiftVersion";

import {doHelp} from "./commands/help"
import {doInit} from "./commands/init"
import {doCreate} from "./commands/create"
import {doBuildAsync} from "./commands/build"
import {doTestAsync} from "./commands/test"
import {doPackageAsync} from "./commands/package"
import {doDeployAsync} from "./commands/deploy";
import {doPublishAsync} from "./commands/publish";
import {doDoctor} from "./commands/doctor";
import {startLocalServer} from "./commands/start";
import {doSettings} from "./commands/settings";

const command = process.argv[2] || 'help'
const args = process.argv.slice(3)

async function processCommand() {
    switch (command) {
        case 'version':
        case '--version':
        case '-v':
            console.log(`Lift v${getLiftVersion()}`);
            return;
        case 'help':
            return doHelp(args[0] ?? '')
        case 'doctor':
            return doDoctor();
        case 'init':
            return doInit(args[0] ?? '')
        case 'create':
            return doCreate(args[0] ?? '')
        case 'build': {
            const ret = await doBuildAsync ( args )
            if (ret) process.exit( -1 )
        }
        return;
        case 'test': {
            const ret = await doTestAsync(args);
            if (ret) process.exit(ret);
        }
        return;
        case 'start':
            return startLocalServer();

        case 'package': {
            const ret = await doPackageAsync(args);
            if (ret) process.exit(ret);
        }
        return;
        case 'deploy': {
            const ret = await doDeployAsync(args);
            if (ret) process.exit(ret);
        }
        return;
        case 'publish': {
            const ret = await doPublishAsync();
            if (ret) process.exit(ret);
        }
        return;
        case 'settings': {
            const ret = await doSettings();
            if (ret) process.exit(ret);
        }
        return;
    }
    return doUnknown(command)
}

function doUnknown(command:string) {
    console.log(ac.red.bold(`Unrecognized command ${command || ''}`))
    console.log(ac.grey.dim('try'))
    console.log(ac.blue.dim('help, init, create, build, test, start, package, deploy, publish, settings'))
    console.log('')
}

processCommand()