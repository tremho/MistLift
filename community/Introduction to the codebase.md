# Introduction to the MistLift codebase

Welcome to the MistLift OpenSource project. If you are interested in contributing
to this project, you will want to become familiar with the code.
Before you begin, be sure you are familiar with all of what MistLift does from
a user standpoint. Make sure you have gone through the 
[MistLift QuickStart](../doc/MistLift%20Quick%20Start.md),
and are familiar with all the [Lift Command Actions](../doc/Lift%20Command%20Actions.md).

If you are ready to write new code,
Please start by reviewing the [Architectural Overview](../doc/Architectural%20Overview.md).
Browse the other document files in this repository for more insights.

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

Not a part of the main repository, another project named `@tremho/inverse-y`provides
an NPM package with functions that support activity at AWS and the Lambda function 
support.

To contribute to that project,
please see the [inverse-y project](https://github.com/tremho/inverse-y). If you plan to make
changes there, please give a heads up to [Steve Ohmert](email://steve@ohmert.com) of your intentions.

