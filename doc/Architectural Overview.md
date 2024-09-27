
# Mist Lift Architecture

Mist Lift is a framework that allows local creation of web service API functions,
allows one to run, test, and debug these services locally, and then deploy these
functions to the cloud as a cohesive API ready for applications or other uses.

![architecture diagram](Lift%20Components%20and%20Actions.png)

A Mist Lift project relies on the following parts:

- The `lift` commands
- A `lift` generated project directory that has the proper structure and key components
- The developer's favorite IDE tool for editing/debugging

The Mist Lift stack is designed for NodeJS development. Other stacks are 
planned for future support.

The initial project code includes package dependencies from npm as needed
to support basic operations and AWS Lambda integration.

The developer creates and edits code within the "Functions" folder of the
project directory.

Project code is written in Typescript.  Typescript is installed with `lift` if not already
available, and the typescript configuration for the project is created at
init time.

The developer adds any additional npm packages needed by their project in the normal fashion.

When the `lift build` command is executed, executable Javascript is created in the 
`build` directory. The definition.json files from the functions are copied.

The local server is a simple NodeJS Express server, and it is started with the command
`lift start` command (this is a blocking command. Run in a separate window or in background to retain command line access).

OpenApi (aka Swagger) documentation is generated when the /api endpoint is accesssed.
This uses the npm pacakge openapi-ui to generate the api docs from the information
in the copied definition.json files.

Deploying to the cloud consists of a series of steps.
First, the code must be built, and then packaged into a ZIP file
for upload to AWS as a Lambda function.  The zip file must contain
everything needed for the function to run as a standalone Node package.
This includes a proper package.json, and of course all of the required
source code.

Individual commands handle `build`, `package`, and `deploy`, but the prequisite
steps are handled by the successive ones, so there is no real need to use the
`package` command directly.

On `lift deploy` the packaged zip is uploaded to AWS and installed as a Lambda function
under the function name.  You can go to your AWS Console and find your Lambda function there.

The Lambda functions by themselves do not an API make.  To make these functions
accessible, the `lift publish` command completes the effort.
This command will create a corresponding AWS API Gateway resource and bind the Lambda functions
to it.  
It also will create an "file serve" function for the webroot folder and any
subfolders within this location and install these lambda functions also.
These are used to serve files like a static web service might, but should really 
only be used for locally relevant assets. For example, the /api command returns
HTML content that calls for the reference to supporting css and script files from here.

Each webroot subdirectory is mapped as a different lambda function because of the REST-style url mapping.
If you have subdirectories (e.g. foo/bar), the '/' separator will cause the expectation of another
function, so if your file is at /foo/bar/baz.txt, then there must be a function handler
at /foo/bar to handle it.  This is done automatically on publish.
Alternately, a '+' passed within a url to a file serve lambda function will be interpreted
as a '/' separator for the internal file structure, so /foo+bar+baz.txt will be handled by
the webroot file serve handler directly. Prefer use of this form for internal resource references.
External references should continue to use the standard '/' path separation.

Each Api publish will create a new API resource, invalidating any previous link.
The current public link will be reported at the end of the operation.
Access to functions is possible by appending the function name to the reported
api root.  (e.g. /helloworld).

Starting with version 2.1.0, there is a new `update` command.  Use `update` to 
update webroot files for an existing deploy without a destructive re-publish.
Note that you _must_ republish to support any new functions or changes to existing
function call signatures.

Within the MistLift repository sources, the code for the various `lift` commmands
may be found in the src/commands folder.

Handling for the local express server is contained in the src/expressRoutes folder.

Miscellaneous library and helper functions are in src/lib

The entry point for the `lift` command itself is in src/lift.ts

When copying starting files for the `lift create` command, the template sources 
for this come from the templateData folder.  The web support css and script for the OpenAPI
display is also found in this location. These are copied to the 'webroot' folder of
the destination project during the `lift init` process.




