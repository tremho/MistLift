const root = document.getElementById('root')
const label = document.createElement('H1');
const message = document.createElement('p');

label.innerText =  'Hello MistLift'
message.innerText = "This page content is generated from the default javascript MistLift page in webroot/app.js"

root.appendChild(label);
root.appendChild(message)