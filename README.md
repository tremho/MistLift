
# MistLift

_CLI tools and structured project support for easy-access cloud development_

MistLift, aka [@tremho/mist-lift at npm](https://www.npmjs.com/package/@tremho/mist-lift) is an OpenSource project aimed at providing an easy and seamless platform for developers
to quickly develop cloud services locally and then migrating to cloud with a simple and
lightweight Command Line API that avoids some of the more intimidating aspects of 
using larger frameworks for such purposes.

This provides a much lower barrier to entry to would-be cloud developers
and encourages a more open, distributed set of architectural choices from the 
very beginnings of a new project.

The initial version of MistLift is complete with minimal viability 
to represent its future potential.  It focuses on a Typescript (JavaScript) oriented
NodeJS stack hosted on the Amazon Web Services (AWS) Cloud infrastructure.

In the future, other stacks will be supported, including DotNet and Python, and
other stacks supported by AWS.
Other cloud hosts, such as Azure, are also planned to be supported in future versions.

## Contributions Needed

MistLift is fully functional now, but there is much more planned in the
vision roadmap, and your help is needed!

[GitHub Repository](https://github.com/tremho/MistLift)

Any level of involvement or contribution is appreciated.  Please see
the [Contribution Guidelines](https://github.com/tremho/MistLift/blob/main/CONTRIBUTING.md).

Also review the [Future States Plan](https://github.com/tremho/MistLift/blob/main/doc/Future%20State%20Planning.md)
and the [issues page](https://github.com/tremho/MistLift/issues) for future state plans and status. 

## Getting Started

To get started using MistLift, please see the [QuickStart Guide](https://github.com/tremho/MistLift/blob/main/doc/MistLift%20Quick%20Start.md)


## Changelog

### 1.2.0

- __Minor Breaking Change__ service definition _allowedMethods_ changed to just _method_. No more pretense of supporting multiple methods for the same function.
This is breaking because any previous service definition files need to change this property name to continue to work with this version or later.

- Support for a common library shared by functions (_see [Tips and Techniques](./doc/Tips%20and%20Techiques.md))
- Support for esbuild (e.g. React) (_see [ESBuild and React support](./doc/ESBuild and React support.md))

### 1.1.8

- Fixed a bug with certain forms of JSON responses on AWS

### 1.1.5, 1.1.6, 1.1.7 -- 7/2/24

- A number of Windows-related fixes 

### 1.1.1, 1.1.2, 1.1.3, 1.1.4 -- 7/1/24

- documentation updates
- insure commands issued at project root
- build if necessary before starting local server
- fix local request handling treatment of body
- fix package definition cross-over bug
- add lint and test targets
- fixes for Windows and its wacky ways

### 1.1.0 -- 6/28/24
- add `info` command

### 1.0.3 -- Initial Release 6/27/24
- Include missing template files in npm publish

### 1.0.0 - 1.0.2 -- Pre Release 6/26/24
- Basic functionality
- minor bug fixes
- documentation
- ts-standard linter adopted



 
 
 
 
 
