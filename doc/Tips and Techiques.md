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


