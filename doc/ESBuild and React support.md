# Support for ESBuild
## _An implementation strategy for React Support_

As of Version 1.2.0, optional support for esbuild is established.  

When configured, this extends the action of `lift build` (whether invoked explicitly or indirectly) to also do an 
esbuild for a given directory and output the resulting bundled .js file into the `webroot` location so that is available for front-end access.

This would be most commonly used for React-style projects, although it could just as easily be used with any other framework that benefits from a 
fast build bundler.

### To configure

- Create a json file at the root of your project named `esbuildConfig.json`. It should represent this example:

```json
{
  "entryPoints": ["app/app.jsx"],
  "outdir": "webroot",
  "watch": true

}
```
The `entryPoints` property should point to a .js (or jsx, ts, or tsx) file that comprises the main entry point of a front-end design.
The named module may import other modules (components, etc) to comprise the full bundle beyond the entry point.

The `outdir` property is optional, and names the location the resulting bundle will be output.  By default this is `webroot`. In this example, it is unnecessarily naming the default.

The `watch` property, if set `true`, will (very quickly) rebuild the bundle if there are changes made to any of the files it contains.
You will have to refresh the browser yourself, though, because this automation is not yet in place.
There is also no hot-reload in place for the backend functions currently. Only the front-end esbuild items.

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