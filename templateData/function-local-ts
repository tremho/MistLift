
import {start} from "./main"
import fs from "fs";

async function run() {
    const name = process.argv[2]
    let request = {}
    if(name) {
        const path = `functions/HelloWorld/${name}`;
        console.log("Local run with request " + path)
        request = JSON.parse(fs.readFileSync(path).toString())
    } else {
        console.log("Local run with default request");
    }
    console.log(await start(request, null, (ret:any) => { return ret; }));
}
run();