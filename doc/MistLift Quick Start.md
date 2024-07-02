# Getting Started with MistLift

## Prerequisites
You will need a node/npm system to get started.

For best node practice, it is recommended to install Node via NVM (node version manager),
however, a straight installation of node will work just as well.

You should install the latest LTS version of Node, which as of this writing is
at v20.15.0

_If you are on Windows, however, the direct install is probably your best bet -- there are other alternatives, but many of them seem broken -- this used to be so simple -- visit the [NodeJS download prebuilt-installers page](https://nodejs.org/en/download/prebuilt-installer) and download the latest LTS version (e.g. 20.15.0).  Follow the instructions which may include installation of other components._

Once installed, check your versions
`node -v`
`npm -v`

node must be version 16 or higher

npm version should be 9.6.4 or greater on Windows, or 10.3.0 or greater on Mac / Linux

Installing MistLift will also install Typescript if you don't already have it.
You should be using Typescript 5.3.3 or higher.

Install typescript with `npm install -g typescript`
then try `tsc -v`

You should also check to see if you have the 'unzip' command installed on your system,
try `unzip -v` to receive version info.


To use the cloud features, you will need to set up an AWS account.
See [Getting set up with AWS](./Getting%20set%20up%20with%20AWS.md) for 
instructions on this part.

### Installing MistLift

Install MistLift with the command

    npm install -g @tremho/MistLift

Once installed, type

    lift doctor

to insure things are working as expected to start.

---

## Starting a MistLift project

MistLift applications / apis are developed within separate project directories called MistLift Projects.  

These directories should become the repository root for your source control system (such as Git) for each project you create.

You will use MistLift commands to develop and manage this project through development and into release to the Cloud.

Start a new project with the command

    lift init <PathName_of_project_directory>

This will create a new project directory and then proceed to ask you questions.
Answer the question prompts for key information about your project.
When it is created, you can navigate to this project and be ready to code.

### Front and back

Within your new project directory you will find the folders 'functions' and 'webroot'.

The webroot is, as you might expect, the root path for normal static web content assets your application will need.
This is not designed to be a full web server, so limit assets here to be support files for services and simple UI pages
for the most part. Avoid hosting large, or streaming assets such as video files from this source.
If your overall project requires static web content, consider establishing different support for this,
such as AWS Amplify, GitHub Pages, or other providers for efficient and low cost solutions.

MistLift content should be limited to web service APIs as much as possible.

You will notice a 'docs' folder in here.  Ignore this for now.  It is used later when we create function APIs.

The 'functions' folder is where MistLift service functions will be created, developed, and deployed from. 

#### A Front-end only example

Navigate to the webroot folder of your new project and create a file named `index.html` with the following content:

    <html><head><title>Hello</title></head><body><h1>Hello, World!</h1></body></html>

_yes, you saw this one coming 😉_

Now type

    lift start

and then use a browser to navigate to http://localhost:8081

and you will see your page displayed.  You can create and edit your front end in this conventional way as much as you like.
Press ctrl-C to stop the local server.

#### Creating a back-end function

Now let's create a service function.  In keeping with quickstart traditions, the function we create at first will also simply
report "Hello, World!".

return to the root of your project directory and

type

    lift create HelloWorld

This actually creates a working Hello, World! example as a starting point.  We are almost done!  First, we need to attach this
function to a route, and to do this, go to functions/HelloWorld/src
and look at the file definitions.json

- this describes the function.
- it will be accessed at the uri path /helloworld
- it is a GET method function
- it takes no parameters

Look now a the file main.ts in this directory.

- it logs a messsage
- it returns a string "Hello, World"

For a real function for your application,
you would edit both the definition.json and main.ts source files in the functions/HelloWorld/src folder to match the needs of your new API function.

but for now, we'll stick with the "Hello World" default.

##### build the function

before we can serve our new function locally, we must build the functions

type

    lift build

to do this.

Now, simply start your local server again with

    lift start

and then navigate to http://localhost:8081/helloworld


You should see "hello, world!" returned from this endpoint.

### API docs

navigate your browser to http://localhost:8081/api

This will present an OpenAPI listing of your function API (sometimes referred to as a "Swagger page").  Right now, of course,
we just see our single /helloworld API, but other functions you create will be documented here as well.
This information comes from the description.json file of each function.

__That's it!__   
as you can see, we have successfully created both front and back end components.  
It is beyond the scope of this quickstart to explain the craft of full-stack development, but
in a nutshell:
- Create functions to produce the service you need
- The return can be JSON, text, html, or any other type.
- Create a front-end that calls this service endpoint and acts upon it within it's UI presentation
- Lather, rinse, repeat until you have completed your awesome application.
- deploy to the cloud.

More information about editing the description.json file and best practices for creating function services are to be found
in additional documentation.

## Deploy to cloud

Let's go ahead and deploy our simple Hello World front-and-back example to the cloud, just to show how this is done:

The process is the same here as it is for a more complete app.

Basically, use these two commands:

    lift deploy

    lift publish

The publish command will report an endpoint from the cloud.  It should look similar to this, but with different identifiers:

`https://8204kxvzs9.execute-api.us-west-1.amazonaws.com/Dev`

The content you created is accessed via uri paths off of this, so for example, 
`https://8204kxvzs9.execute-api.us-west-1.amazonaws.com/Dev/helloworld` will execute your helloworld service,
and `https://8204kxvzs9.execute-api.us-west-1.amazonaws.com/Dev/index.html` will show your front-end html content.

Go here with a browser and you should see your front-end Hello World content if you access it as
<publish_url>/index.html or as <publish_url>/+.  If you enter an unknown endpoint, you will receive a response similar to
`{"message":"Missing Authentication Token"}`

Note that index.html is not automatically invoked by simply appending a / to the end of the <publish_url> as one might expect.  This is because the path must
contain a filepath before it is recognized. This is why /+ will work for this (+ can be substituted for / in any MistLift path).

You can also access the <publish_url>/helloworld endpoint and you should see the service content. These should be the same as what you saw locally, but now it is public on the internet!

If you make further revisions to your functions, but do not change the API signatures, simply use the `deploy` command again to update
the changes to the cloud.

If you make a change to the api definitions, or to any of the webroot content, you must use the `publish` command again. But note that this invalidates the previous url and produces a new one.

## Testing and Debugging
It is a rare project that doesn't need to be tested and debugged in one way or another.
One of the advantages to using `lift` is that you can do most of your testing and debugging locally
where you have more tools at your disposal, rather than facing troubleshooting entirely
once the code is deployed to the cloud.

### Local run without browser

You can run your function directly in Node without running the local server. The log output and the response object will be printed to the 
console.  This is helpful for simple tests and debugging purposes.

To do this, run this command from the project directory

`node build/functions/<Function_Name>/src/local.js`

Replacing "<Function_Name>" with the name of your function, for example:

`node build/functions/HelloWorld/src/local.js`

You will see the output of the request processsing logs and finally, after the Trace log "Calling Handler..." is seen,
any log messages that originate from your function, a Debug log that shows the content-type chosen for your response (if your function
didn't specify this itself), and then the object of the function response. 

You can also specify custom requests be sent to this local run option by creating a json file within the function directory of 
your function (e.g. "request.json").  See [Request and Response details](./Request%20and%20Response%20details.md) 
for the properties you can include in a local request. 

Then run the command with a parameter, such as

`node build/functions/HelloWorld/src/local.js request.json`

### Testing

Local unit testing is supported by the test framework TAP (https://node-tap.org)
Files with the extension `.test.ts` (compiled to `.test.js`) are found and
executed across the project.  The framework creates a test folder within the
function directory for an api function as a convenience, and to keep these files
separated from the functional source files.
The command `lift test` will initiate the tap testing.

### Debugging

The exact steps used for local debugging will depend upon your development set up and your choice for IDE or other debugger.
Troubleshooting problems for apis deployed to the cloud will require you to access the logs in your AWS console.

#### Local Debugging using your IDE debugger

Your IDE likely has a mechanism for debugging NodeJS scripts.  Use this and the "local run" option described previously to
execute your code via the debugger.
For example, in the WebStorm IDE, create a new debug configuration for NodeJS, set the project root as the current directory, and point
the target JS file to `build/functions/HelloWorld/src/local.js`.
Set a breakpoint at the start of your function in "main.ts" (where the Log.Info statement is) and run in the debugger.  You should hit the
breakpoint you set.  With this, you can step through and investigate your code execution.


#### Debugging using logs
Debugging using logs is available both locally and once deployed to cloud.

- If you run locally, the logs are emitted directly to the console window.
- If you run via `lift start`, logs appear in the console window where `lift start` was executed.
- If you run via the AWS cloud, you can find your logs in the AWS console under CloudWatch.

##### Reviewing Cloudwatch logs

- login to your AWS Console (console.aws.amazon.com)
- go to the Cloudwatch section
- look in Log Groups and find the function to debug (e.g. /aws/lambda/HelloWorld_xxxxxx)
- Find the latest log stream at the top of the list.  Refresh if this is not the most current.
- Click into this to reveal the log messages.
- You can reveal the log message by clicking the arrow to the left of each mesasge entry.
- There will be several logs (8-15) issued by the request handling before reaching your code function
- You should then see any logs your function has produced.








