
## Webroot resource redirects

Files placed in a tree under the `webroot` directory will be uploaded to be available for
loading as resources if for a webpage or SPA application that may be hosted here.

However, these free resource files are subject to some limitations.

for most text-based file formats such as txt, html, js, css, and other, simply having
these at the webroot as one would for a conventional web page is fine.

However, if you have image or other binary content files, or if a file is quite large, these may not be correctly served
by the Lambda function.

To provide an alternate for file hosting and to create a solution for these problematic files,
the notion of external redirects is now supported as of __version 2.2.0__

For this scheme, you must first publish the assets you wish to keep external at some other
url.  This could be an [AWS Amplify destination](https://aws.amazon.com/amplify/?trk=9eb02e4d-80e0-4f27-a621-b90b3c870bf3&sc_channel=ps&ef_id=EAIaIQobChMIibKDla-CiQMVrxCtBh2u3SX7EAAYASAAEgJ9UfD_BwE:G:s&s_kwcid=AL!4422!3!651751060764!e!!g!!aws%20amplify!19852662236!145019201417&gbraid=0AAAAADjHtp80ewq9CyMhoMzNRfN-JlzX-&gclid=EAIaIQobChMIibKDla-CiQMVrxCtBh2u3SX7EAAYASAAEgJ9UfD_BwE)
or an [AWS S3 hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html) solution,
or [Github Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
or any other site where you can place your assets for direct web download.

Then, create a json file named `redirects.json` and place it in your webroot folder.

This json object describes a map of resource file paths (relative to webroot) and the
redirect url that contains the external source for this resource. If a request fits a mapping
from this object, the response will be a 301 redirect to the external location.

For example, let's suppose you have some images you want to serve and might think to put them into
the webroot folder like this:

webroot (folder)
 - mainpic.png
 - another_picture.png
 - images (folder)
   - cover.png
   - sidebar.png
   - logo.png
   
You may or may not have luck serving these images as expected.
But if you make these external, for example, on an Amplify static publish deployment
at, say, https://staging.xxxxxxxxxxx.amplifyapp.com

you would create a redirects.json file that looked like this
```json
{
  "mainpic.png": "https://staging.xxxxxxxxxxx.amplifyapp.com/mainpic.png",
  "another_picture.png": "https://staging.xxxxxxxxxxx.amplifyapp.com/another_picture.png",
  "images/cover.png": "https://staging.xxxxxxxxxxx.amplifyapp.com/images/cover.png",
  "images/sidebar.png": "https://staging.xxxxxxxxxxx.amplifyapp.com/images/sidebar.png",
  "images/logo.png": "https://staging.xxxxxxxxxxx.amplifyapp.com/images/logo.png"
}

```

Note that for publishing to the cloud, these files do not need to be present in  your webroot folder.  However, if you have files
within a folder (as `images` is here in this example), you ___must___ create the folder within webroot so that
the directory association is made for file service recognition.  The folder can be empty, but it
must exist at publish time.

For local serving (with `lift start`) the files must exist in their correct webroot locations.  Redirected links are not supported for the local server.

When the content is published (via `lift publish` or `lift update`) references to the paths of the image files
named in the redirect will be served from the Amplify static site instead.

Again, the locations of  your redirected files can be any valid public url source.
The file path structure and the file names need not match the mapped references, although this is generally more convenient.






