# What the lift commands are doing

## init

(commands/init.ts)

Init is used to create a  new project space and populate it with all the starting ingredients.

It will take the target directory as its argument.

### Directory creation

It will create the target directory if it does not already exist.

The "functions" and "webroot" folders are created within the directory.

The 'webroot/docs' folder and the openAPI source files are copied to the new webroot.

### User interrogatory

Then a series of questions are asked (command/actions/initQuestions.ts) These answers will be used to create the target package.json file.
The default answers for the questions are gathered.  If there is an existing package.json file at the destination, 
most of these values come from there.

The git user name is obtained with the command `git config --get user.name`.  If git is not available as a command, no name is provided.

A default name may be derived from the name of the target folder.
A default copyright statement is generated as the current year and the name of the project.

If an answer to a question fails basic validation, the question is repeated.

In the end, all the values for the package.json that need to come from the user are collected.

### Completing init

Once package.json is set with the answers to the questions, _addPackageScripts_ will add any script commands it will use.
Currently, this is only the "test" script (invoking `lift test`).

#### Installing packages
Finally, the destination project is set up with the following dev-only dependencies:
- _@types/node_ -- For typescript support under NodeJS
- _typescript_ -- The typescript transpiler
- _tap_ -- TapJS test framework

and one runtime dependency:
- _@tremho/inverse-y_ -- handles lambda function support and logging.

---
## create

The create command creates a new function in the project.

A new function starts out as a "helloworld" example.  The developer must modify this to fit their needs.

The create command accepts the name of the function to create as its argument.

If no name is given, help for the command is offered.

The create command finds the function directory in the project and creates a folder of the new function name.
It then creates the subdirectories for 'src' and 'tests' within this directory.
It then performs a series of copies from the MistLift templateData location to the correct locations in the project,
replacing templated text with apppropriate values as it does.

- _src/definition.json_ -- (templateData/function-definition-template) - The function definition for the api of this function. See [Function Definition file](./Function%20Definition%20file.md).
- _src/local.ts_ -- (templateData/function-local-ts) - This is the launch file that starts the main function for serverless local run / debugging.
- _src/main.ts_ -- (templateData/function-main-ts) - The function entry point.
- _src/runmain.mjs_ -- (templateData/function-runmain-mjs) - a bootstrapping launch file used at AWS
- _<functionName>-tests/Sanity.test.ts (templateData/function-test-template) - a no-op example Tap unit test file

## build

the build command builds the typescript functions into run-ready javascript.

Output of the build command goes into the `build` folder.

one or more function names may be given as arguments.  If no arguments are given, all functions
are built with default options.

Wheb declaring function names as arguments, options may also be given.  Valid options are

- __--clean__ -- forces a build by clearing the build directory.
- __--failfast__ -- if a function fails to build, stop the entire series.
- __--deferfail__ -- opposite of failfast.  Build all then report errors.

If --clean is selected, the build directory is removed.

for each of the functions,
if the source contains a file newer than the build output, the `tsc` compiler is invoked
with settings that build the .ts files and output to build.

After compiling, the function definition file is copied to build.

If there are files associated with the function (as in fileserve implmentations), the `__files__` directory and
its contents are copied as well.

---
## package

The package command zips a function folder from the build location into a zip file 
that can be deployed to AWS.

one or more function names may be given as arguments.  If no arguments are given, all functions
are built and packaged with default options.

the package command will invoke the build process to insure the functions are all up to
date before zipping.  The --clean option may be used to force a rebuild.


A temporary folder named `.package_temp` is created at the project root, and
the function files are copied there.

a package.json is constructed for the new deployed function, using values found
in the project package.json settings. The source code is inspected for imports and 
those dependencies are matched to the project settings dependencies and migrated.

An `npm install` is performed on the package to populate the node_modules folder

The .package_temp directory is zipped and placed into a `MistLift_Zips` folder in 
the project root, under the function name.

The temp directory is removed when packaging is done.

---
## deploy

Deploys a package zip to an AWS Lambda function.

one or more function names may be given as arguments.  If no arguments are given, all functions
are built and packaged with default options before deploying.

deployments are timestamped into a local file named `.deployed`.  If the timestamp here is greater
than the file time of the zip file being deployed, deployment is skipped.

Specifying the option "--clean" will clear the `.deployed` timestamps, forcing a deployment.

An option `--no-package` may be specified to skip packaging and simply re-deploy the existing
zip, regardless of build status.

Packages are deployed with a name that is decorated with a suffix that is the md5 hash
of the combination of the project name and the project version.  
This keeps similarly named functions from colliding in the same AWS namespace.

Uploading to AWS uses some configuration values to specify the AWS account holder's
services role identifier, and the correct NodeJS runtime.

TODO: Configuration

---
## publish

The publish command is used to publish the API as an AWS Api Gateway resource that contains
bindings to each of the deployed functions.

The publish command takes no arguments.
In the future, the command may accept an argument specifying the AWS stage to publish to, but
for the current version, the publish stage is always "Dev".

Part of the publish operation is to deploy the api handler and the webroot static files servers.
The webroot subfolder fileserve handlers are registered at the path of their respective subdirectories and simply redirect
to the main webroot handler, replacing any '/' characters in the path with '+' so that 
they will pass to the webroot handler where the path is reconstructed and the
file is served.  

These builtins are deployed from the MistLift src/commands/builtin/prebuilt-zips folder.

An OpenApi yaml document specifying the api is constructed.  This is used both for the api output
and for informing AWS of the api to import.  On deployment, this file is uploaded
to AWS and then the integrations for each function are stitched in.

The previous version of the API is destroyed, and the new one is created.

Each publish produces a new API resource, with a new URL.  

---
## help

The help command outputs documentation for MistLift.

`lift help` by itself gives an overview list of commands.

`lift help <command_name>` gives detail on the named command.



---
## start

This command starts the built-in Express server

The source code for this action can be found in the start command itself with
route handling in src/ExpressRoutes.



---
## test

This command invokes the Tap test framework for running unit tests


---
## doctor

This command inspects the status of the dependencies necessary to run MistLift
and reports the version numbers of each component.



No building dependency is assumed with this command, so you must be certain your
functions are deployed prior.










