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

- _src/index.ts_ -- This is the launch file that actually starts the main function on a function invocation.   