# TODO

Describe the different parts of the code and how it fits together.

Note how inverseY fits into this and how to jump to that project.

- Express server
- CLI and commands
- User project structure
- User AWS credentials and configurations
- AWS Lambda functions (InverseY)

Current and future state architecture

--

There are several key parts to the architecture that fit together to complete the 
package.

The `lift` command itself and the CLI operations that comprise it.

The file `src/lift.ts` makes up the entry point of the `lift` comand and
imports the handling code for each of those commands from the `source/cmmmands`
folder.

The `templateData` folder holds the templates for the code files that are created
in the user project space on a __"create"__ operation.

the `src/expressRoutes` folder handles the local server and its handling for hosting the
user functions as a locally testable API.

the `src/lib` folder holds miscellaneous support functions, including the OpenAPI
_Swagger_ page generation code.

Not a part of the main repository, another project named "InverseY" provides
an NPM package with functions that support activity at AWS and their Lambda function 
support.


