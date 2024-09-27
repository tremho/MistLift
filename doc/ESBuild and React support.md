# Support for ESBuild and Hot reload
## _An implementation strategy for React Support_

As of Version 1.2.0, optional support for hot reload and esbuild is established.  

When configured, this extends the action of `lift build` (whether invoked explicitly or indirectly) to also do an 
esbuild for a given directory and output the resulting bundled .js file into the `webroot` location so that is available for front-end access.

This would be most commonly used for React-style projects, although it could just as easily be used with any other framework that benefits from a 
fast build bundler.

### To configure

- Create a json file at the root of your project named `localServerConfig.json`. It should represent this example:

```json
{
  "port": 8081,
  "rebuildFunctionsOnChange": true,
  "refreshBrowserOnFunctionChange": false,
  "refreshBrowserOnWebrootChange": true,
  "esbuild": {
    "watch": true,
    "entryPoints": [
      "app/app.jsx"
    ],
    "outdir": "webroot"
  }
}
```
The `port` property is optional (default is 8081). This defines the service port for the local server.
The `rebuildFunctionOnChange` property, if true, will automatically rebuild the backend functions if there is a source change.
The `refeshBrowserOnFunctionChange` property, if true, will also signal the browser to refresh if a function is rebuilt. 
The `refreshBrowserOnWebrootChange` property, if true, will signal the browser to refresh if any file within the webroot tree
changes. Most likely in a hot reload configuration you would want this set to true, and `refreshBrowserOnFunctionChange` to be false. 
The `esbuild` section is optional.  If omitted (or renamed), esbuild is not invoked.
If the `esbuild` section exists, it will build the files invoked by the building of the  `entryPoints` property. 
This should point to a .js (or jsx, ts, or tsx) file that comprises the main entry point of a front-end design. 
The named module may import other modules (components, etc) to comprise the full bundle beyond the entry point.
The bundle will be written to the outdir (webroot) with the name of the entrypoint file (e.g. `app.js`)
The `outdir` property is optional, and names the location the resulting bundle will be output.  By default this is `webroot`.
The `watch` property, if set `true`, will (very quickly) rebuild the bundle if there are changes made to any of the files it contains.
Since this will update the corresponding file in the webroot, the browser refresh will signal according to that flag.

ESBuild will compile all the constituent files and put the output into the `webroot` folder (by default, or other directory if so named by the `outfile` property).
You should then create an endpoint that uses this bundle, for example, `index.html`:
```html
<html>
<head>
    <title>App Page</title>
    <link rel="stylesheet" href="./app.css"></link>
</head>

<body>
<div id="root"></div>
<script src="./app.js"></script>
</body>

</html>
```
A React app using this bundle might look a little like this example:

`app.jsx`:
```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'

import MainPage from './MainPage'

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
    <>
    <MainPage/>
    </>
)
```
I won't go further into the nuances of using React -- I'll leave that to others with more React experience and skill to elaborate on.

But I expect this is enough to get you started.  Have fun,

As of version 2.1.0:
If you are updating your react project and wish to redeploy it locally, and you have
not made any changes to your MistLift API functions, you may use the `lift update` command
to redeploy the webroot files (including an esbuild rebuild of your react app) without a republish.

