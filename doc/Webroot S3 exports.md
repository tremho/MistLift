
## Webroot S3 Exports

As of __Version 2.3.0__ (March, 2025), there are new options for how static files that are
served as 'webroot' assets are made available to the deployed functions.

#### Why this is needed
The initial versions of _MistLift_ relied upon a 'self-serve' mechanism in which assets found
in the webroot location would be included in the packaged zip to be delivered on request.
The request for these assets would be handled by deployed "fileserve" functions at each directory
path, which would fetch the associated uploaded file and return it as the output of the function,
along with the corresponding content type.

This worked well for small and simple files.  However, for larger files, such as signficantly
large .js app bundles, large images, or media, this was insufficient.

We've also found that changes in AWS seem to have made previously valid image files
no longer valid when served through the webroot "SELF" handlers.  More research on this may
yield a successful result, but for now at least the recommendation is to switch to S3 serving
if you rely on any binary assets (such as image files).

An earlier workaround was through a redirect.  Users were advised to host their larger content
elsewhere and provide a redirect location for it in a JSON file according to directions
in this _now-deprecated_ document: [Webroot Resource Redirects](./Webroot%20Resource%20Redirects.md).
Note that this technique may still be used, but it is problematic, and often does not work as expected.

Now, however, a better solution exits: Using S3 to hold the static content found in the webroot.

By default, the original "Self-Serving" solution will be used for asset serving.
This works out for most small projects, and there is no need to change it unless you
anticipate or experience troubles with your larger assets as  your project grows.

#### New way of accessing asset urls
A new API function, `getAssetUrl` (imported from @tremho/inverse-y) is now available to
functions. Call this with the name of the asset (the relative path from webroot) to
receive the full publicly accessible url. This url will be valid both locally and
when deployed by any export method.

for example
```javascript
page = `<img src=${getAssertUrl('images/myImage.png')}/>`
```

#### webrootConfig.json

At your project root, if you include a file named 'webrootConfig.json' and supply
a simple bit of JSON:
```json
{
  "type": "S3"
}
```
you will tell _MistLift_ to use the new S3 webroot feature.

The "type" property defines the type of export mechanism to use.
Valid values for "type" are "SELF", "S3", or "SCRIPT".  (SELF is the default)

Other types or other property options may be defined in a future expansion of this feature as
_MistLift_ evolves.

You should force a clean rebuild of your project if you change the webroot export type before
republishing.

##### "SELF" and "S3"
For types "SELF" and "S3" there is nothing more to do. If you've chosen the S3 option, you 
will see the bucket name emitted during the publish process. You can find and manage this
bucket in your AWS console if you like (although it is not necessary to do so to use it).
Note that simply removing the webrootConfig.json file will result in a "SELF" deploy type.

##### Type "SCRIPT"
For the "SCRIPT" type, you will need to create a script that will handle the transfer of
files from your project 'webroot' location to a publicly accessible host service somewhere.
This script will be called with a two parameters.  The first parameter is a comma-delimited list of
all the files that need to be transferred.  The second parameter (if given) is reserved for options.

The JSON of a SCRIPT configuration looks like this
```json
{
  "type": "SCRIPT",
  "options": {
    "scriptName": "your_script_pathname",
    "options": "a string of your choice that will be passed to script (second parameter)"
  }
}
```

###### Implementing the script
If the first parameter passed is "--prefix" then the script should not process any files, but should
instead return (via stdout) what the base url prefix is for accessing any uploaded files at the service host.
The script is called with the --prefix option by the _MistLift_ pipeline before it is called
with the file list of webroot files to be transferred.

The SCRIPT option is available to developers with special requirements, and is not expected to be needed  
for normal use.

#### Serving local
Regardless of setting, local serving, via _lift start_ is supported as always by serving directly from the webroot location.

#### Referencing Assets in your application code
As noted above, you should refactor your code that uses assets to use the new
`getAssetUrl` api.  This function is aware of the configured method and how to find
the assets across contexts.






