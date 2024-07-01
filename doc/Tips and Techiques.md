# MistLift Tips and Techniques

## Common code and libraries
You can create a web API consisting of several functions that serve a related purpose, of course.
Use the `lift create` command for each new function name.

If you have common code to share between functions, follow this pattern

1. Create a sudirectory for your library code outside the 'functions' directory, so that `lib` is a sibling directory to 'functions'
<br/>
   Within the `src` folder of each function that will be referencing this common code,
   create a softlink to the `lib` folder from the `src` folder.
   <br/><br/>
On Linux or Mac the command is `ln -s ../../../lib lib`
   <br>
On Windows the command is `mklink lib ../../../lib`
   <br>
   <br>

2. import the modules in at the lib path from within the src code that uses it with the path `./lib/...`

### npm packages
Your code can of course use any npm packages available.
install these packages like normal at the project root with `npm install <package name>`

When your functions are packaged, these dependencies will be migrated for use in the cloud.

## Calling functions from within functions

Avoid making web request function calls to other functions within your api. 
This does not behave well in an AWS deployment.  Instead, structure your code so that
the function itself can be called programmatically and place this is a common library.

Then call this at code level where needed. 

A good pattern in general is to put all your API functionality into a common location,
even if it will not be shared between other functions, and make the actual service
handler just call this code to complete the service.  This allows for better flexibility
and establishes a consistent and more maintainable pattern of construction.

## Resources
If your function needs non-code resources to work with, you can create a directory in your
function directory, alongside the `src` folder, named `resources`.  This folder tree will be copied
to the build directory as a post-build step.  Other directory names will not be copied.

