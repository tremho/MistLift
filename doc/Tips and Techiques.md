# MistLift Tips and Techniques

## Common code and libraries
### local commonLib
As of 1.2.0, a `commonLib` directory is created parallel to the `functions` folder with `lift init`.
Each function created with `lift create` will include a symlink to this folder in its `src` directory, locally
called `lib`.

Place code in the `commonLib` location that is visible to all your functions and
import it within your function modules as `import {myExports} from './lib/MyLibModule`
in each of the functions that uses it.

##### IMPORTANT use of _lib_ local directory
Be sure to use the `lib` symlink for your import statements, and never link directly to
`../../../commonLib` or to any other directory outside of your `src` directory of your function.
This has to do with the way the typescript compiler will construct the resulting object tree and
may produce undesireable consequences on the packaged function.


### npm packages
Your code can of course use any npm packages available.
install these packages like normal at the project root with `npm install <package name>`

When your functions are packaged, these dependencies will be migrated for use in the cloud.

## Calling functions from within functions

Avoid making web request function calls to other functions within your api. 
This does not behave well in an AWS deployment.  Instead, structure your code so that
the function itself can be called programmatically and place this in the common library.

Then call this at code level where needed. 

A good pattern in general is to put all your API functionality into a common location,
even if it will not be shared between other functions, and make the actual service
handler just call this code to complete the service.  This allows for better flexibility
and establishes a consistent and more maintainable pattern of construction.

## Resources
If your function needs non-code resources to work with, you can create a directory in your
function directory, alongside the `src` folder, named `resources`.  This folder tree will be copied
to the build directory as a post-build step.  Other directory names will not be copied.

## Webroot files and directories
It can be convenient to organize asset files under the webroot directory
in the same manner as one might do for a conventional web server.
However, there are limitations and ramifications to doing this you should be aware of.
First, please see the article [Webroot Resource Redirects](./Webroot%20Resource%20Redirects.md)
to understand how large files, binary files, or certain files designed for streaming
should come from another static server location and be redirected as though they
originated at webroot.
The second thing to understand is that every directory and subdirectory made within the
webroot tree forces the deployment of a new _fileserve_ handler.  This is necessary because of the
way AWS path resolution and routing behaves.  As much as possible, try to keep all of your
files within a single directory to minimize this overhead. Too many nested directories may cause a problem in deployment.



