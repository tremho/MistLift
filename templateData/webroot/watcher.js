/* Rebuild and signal a Reload on ESBuild or function changes -- browser watch
* See 'docs/ESBuild and React support.md' for details
*/

let connected = false;
function startWatcher()
{
  if(window.location.host.indexOf("localhost") === -1 && window.location.host.indexOf("127.0.0.1") === -1) return; // localhost only
  console.log("Starting Watcher client")
  const ws = new WebSocket("ws://localhost:8081/watch")

  ws.onopen = (e) => {
    console.log('Watcher Connection Established')
    connected = true;
  }

  ws.onclose = (e) => {
    if(connected) {
      console.log("reload")
      document.location.reload()
    }
  }

  ws.onerror = (e) => {
    console.error("WS Error", connected)
    if(connected)  return ws.onclose(e)

    setTimeout(() => {startWatcher()}, 750)
  }
}

