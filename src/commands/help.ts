import * as ac from 'ansi-colors'

export function doHelp(
    command:string
) {
    switch (command) {
        case 'help':
            return helpHelp()
        case 'init':
            return helpInit()
        case 'create':
            return helpCreate()
        case 'build':
            return helpBuild()
        case 'test':
            return helpTest()
        case 'start':
            return helpStart()
        case 'stop':
            return helpStop()
        case 'package':
            return helpPackage()
        case 'deploy':
            return helpDeploy()
        case 'publish':
            return helpPublish()
        default:
            return helpDefault()
    }
}
function helpDefault() {
    console.log('lift is the command-line tool of the MistLift framework.');
    console.log("");
    console.log(ac.bold("Usage: " + ac.grey("lift " + ac.grey.dim("command  [args]"))));
    console.log("where " + ac.grey.dim("command") + " is one of:");
    console.log("  " + ac.blue.bold("help " + ac.grey.dim("[command]")) + " -- this list, or help on a given command");
    console.log("  " + ac.blue.bold("init") + "  -- create or prepare a directory as a MistLift project");
    console.log("  " + ac.blue.bold("create " + ac.grey.italic("functionName")) + "  -- define and create a new API function");
    console.log("  " + ac.green("build") + "  -- build the project");
    console.log("  " + ac.green("test") + "  -- build, and run unit tests");
    console.log("  " + ac.cyan.bold("start") + "  -- start the local express server");
    console.log("  " + ac.cyan.bold("stop") + "  -- stop the local express server");
    console.log("  " + ac.green("package "+ ac.grey.italic("[functionName]")) + "  -- builds and packages functions into lambda-ready zips");
    console.log("  " + ac.green("deploy " + ac.grey.italic("[functionName]")) + "  -- builds, packages, and deploys function packages to AWS lambda");
    console.log("  " + ac.blue.bold("publish") + "  -- publishes the API and binds to the deployed functions");
    console.log('');
    console.log("use " + ac.bold("lift help " + ac.grey.dim('[command]')) + " for command arguments and detals.");
    console.log(ac.italic("use " + ac.bold("lift version " +ac.grey.dim("or lift -v or lift --version") + ac.grey(" to see current running version of MistLift"))))
}
function printBanner(cmd:string) {
    let out = '  ' + ac.green('╭───────────────────────────────────────────────────────────────╮')+'\n'
    out += '  ' + ac.green('|                                                               |')+'\n'
    out += '  ' + ac.green('|                               Lift                            |')+'\n'
    out += '  ' + ac.green('|                                                               |')+'\n'
    out += '  ' + ac.green('╰───────────────────────────────────────────────────────────────╯')+'\n'
    out += '  ' + ac.bold.green(cmd)
    out += '\n'
    console.log(out)
}
function helpHelp() {
    printBanner("help")
    console.log("use " + ac.bold('lift help') + " by itself to see a list of commands");
    console.log("use " + ac.bold("lift help " + ac.grey.dim('[command]')) + " for help on a given command");
    console.log('');
}
export function helpInit() {
    printBanner("init")
    console.log("use " + ac.bold('lift init .') + " from within a directory to init the current directory as a MistLift project");
    console.log("use " + ac.bold("lift init " + ac.grey.dim('projectPath')) + " to create a new directory at "
    + ac.grey.dim("projectPath") + " if it does not exist and init a MistLift project in that directory, if not already initialized");
    console.log("")
    console.log("This will begin an interactive session where you will be asked questions about the project you are creating.")
    console.log("The project will be complete and ready to run right away.")
    console.log("You can then modify the application to your needs.")
}

export function helpCreate() {
    printBanner("create")
    console.log("use " + ac.bold('lift create') + ac.grey.dim(' functionName') + " to create a new function for your API")
    console.log("")
    console.log("your project folder (set up with "+ac.green.bold("init")+") will have a new function template created as "
    + ac.grey.dim("functionName")
    + " in a folder named "
    + ac.green.dim("functions") + " within your project directory")
    console.log("")
    console.log(ac.grey("The default function will display a'Hello World!' message when built and run" ));
    console.log(ac.grey("Modify the code to suit the needs of your function application"));
}
export function helpBuild() {
    printBanner("build")
    console.log("use "+ ac.bold('lift build') + " to build all your functions and api for your application")
    console.log("")
    console.log("The build step compiles your typescript (.ts) files into executable javascript (.js) files within a folder named 'build' in your project directory.")
    console.log("Files that are not updated are not rebuilt.")
    console.log("The build step is automatically invoked by other actions that depend upon it as a prerequisite, so it does not need to be explicitly run in normal operation.");
    console.log("");
}
export function helpTest() {
    printBanner("test")
    console.log("use "+ ac.bold( 'lift test') + " to invoke the testing framework and run unit tests for all functions")
    console.log("")
    console.log("Tests should be written in files within the named test folder for each created function. test files are given the suffix .test.cs")
    console.log("The test framework used by default is 'Tap'")
    console.log("");
}
export function helpStart() {
    printBanner("start")
    console.log("use "+ ac.bold( 'lift start') + " to start running the local 'Express' server for local execution")
    console.log("")
    console.log("Functions may be run and tested via a local http server powered by express.")
    console.log("By default, access is at "+ac.blue("http://localhost:8081"));
    console.log("");
}
export function helpStop() {
    printBanner("stop")
    console.log("use "+ ac.bold('lift stop') + " to stop the running local 'Express' server")
    console.log("")
    console.log("This will shut down the local server")
    console.log("")
}
export function helpPackage() {
    printBanner("package")
    console.log("use "+ ac.bold('lift package') + " to build and package functions for cloud deployment")
    console.log("")
    console.log("Functions must be packaged into zip files before delivery to the cloud")
    console.log("The package command handles this by first insuring a fresh build and then packaging the function and its module dependencies")
    console.log(ac.grey("This action is invoked as part of deployment, and need not be invoked separately with this command"));
    console.log("");
}
export function helpDeploy() {
    printBanner("deploy")
    console.log("use " + ac.bold('lift deploy') + ac.grey.dim(' functionName') + " to package and deploy a function to the cloud")
    console.log("use " + ac.bold('lift deploy') + " with no argument to deploy all functions to the cloud")
    console.log("");
    console.log("functions will be built and packaged if necessary before deployment");

}
export function helpPublish() {
    printBanner("publish")
    console.log("use " + ac.bold('lift publish') + " to publish the API to an accessible cloud endpoint")
    console.log("");
    console.log("The API must be published be used.");
    console.log("The base url for the cloud API will be returned by this operation.")
}
