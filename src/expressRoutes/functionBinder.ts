import path from "path";
import fs from "fs";

const clearModule = require('clear-module')

import * as ac from "ansi-colors"
import {resolvePaths} from "../lib/pathResolve";
import {GetWebrootServePaths} from "../lib/openAPI/WebrootFileSupport"
import {doBuildAsync} from "../commands/build"


import express from 'express'
import {gatherFunctionDefinitions} from "../lib/openAPI/ApiBuildCollector";
import {buildOpenApi} from "../lib/openAPI/openApiConstruction";
const router = express.Router();


export function functionBinder() {
    const defs = gatherFunctionDefinitions();
    buildOpenApi(defs).then(() => { // creates apidoc.yaml for when /api is run


        const projectPaths = resolvePaths();

        for (let def of defs) {
            const {name, pathMap, allowedMethods} = def;
            const methods = allowedMethods.split(',');
            for (let method of methods) {
                method = method.trim().toLowerCase();
                let rpath = path.join(projectPaths.buildPath, 'functions', name, 'src', 'main.js')
                clearModule(rpath);
                const {start} = require(rpath);

                let entryRoot = pathMap;
                let n = entryRoot.indexOf("/{");
                if (n !== -1) entryRoot = entryRoot.substring(0, n) + "/*";

                const callNoBody = (pathMap: string, req: any, res: any) => {
                    const event = requestToEvent(pathMap, req)
                    Promise.resolve(start(event, null, null)).then(respOut => {
                        handleResponse(res, respOut);
                    })
                }
                const callWithBody = (pathMap: string, req: any, res: any) => {
                    const event = requestToEvent(pathMap, req)
                    event.body = req.body
                    Promise.resolve(start(event, null, null)).then(respOut => {
                        handleResponse(res, respOut);
                    })
                }

                if (method === 'get') {
                    router.get(entryRoot, (req, res) => callNoBody(pathMap, req, res))
                } else if (method === 'post') {
                    router.get(entryRoot, (req, res) => callWithBody(pathMap, req, res))
                } else if (method === 'put') {
                    router.put(entryRoot, (req, res) => callWithBody(pathMap, req, res))
                } else if (method === 'patch') {
                    router.patch(entryRoot, (req, res) => callWithBody(pathMap, req, res))
                } else if (method === 'delete') {
                    router.delete(entryRoot, (req, res) => callNoBody(pathMap, req, res))
                } else {
                    console.log(ac.red.bold("Cannot map method ") + ac.blue.bold(method))
                }

            }
        }
    })
}

function requestToEvent(template:string, req:any) {
    let path = req.originalUrl
    const qi = path.indexOf('?');
    if(qi !== -1) path = path.substring(0,qi);
    let ptci = path.indexOf("://")+3;
    let ei = path.indexOf("/", ptci);
    let host = path.substring(0, ei);
    if(ptci < 3) {
        host = req.headers?.origin;
        if(!host) {
            host = req.headers?.referer ?? "";
            let ptci = path.indexOf("://")+3;
            let ei = path.indexOf("/", ptci);
            host = ptci > 3 ? path.substring(0, ei) : "";
        }
        if(!host) {
            // todo: http or https?
            host = "http://"+req.headers?.host ?? "";
        }
    }
    var cookies:any = {};
    var cookieString = req.headers?.cookie ?? "";
    var crumbs = cookieString.split(';')
    for(let c of crumbs) {
        const pair:string[] = c.split('=');
        if(pair.length === 2) cookies[pair[0]] = pair[1]
    }
    const parameters:any = {}
    const tslots = template.split('/');
    const pslots = path.split('/');
    for(let i = 0; i< tslots.length; i++) {
        const brknm = (tslots[i]??"").trim();
        if(brknm.charAt(0) === '{') {
            const pn = brknm.substring(1, brknm.length - 1);
            parameters[pn] = (pslots[i]??"").trim();
        }
    }
    for(let p of Object.getOwnPropertyNames(req.query)) {
        parameters[p] = req.query[p]
    }
    const eventOut:any = {
        requestContext: req,
        request: {
            originalUrl: host + req.originalUrl,
            headers: req.headers
        },
        cookies,
        parameters
    }
    return eventOut;
}
function handleResponse(res:any, resp:any)
{
    // console.log(">>>>>>>> Handling response >>>>>>>>>")

    if(resp) {
        if (resp.cookies !== undefined) {
            // console.log("--- see cookies", resp.cookies)
            var cookies:any = []
            if(Array.isArray(resp.cookies)) {
                cookies = resp.cookies
            } else {
                var age = resp.cookies.expireSeconds ?? 60; // 1 minute
                delete resp.expireSeconds;
                Object.getOwnPropertyNames(resp.cookies).forEach(name => {
                    var value = resp.cookies[name];
                    cookies.push(`${name}=${value}; Max-Age=${age}; `);
                })
            }
            // console.log("cookies being set", cookies)
            res.setHeader("set-cookie", cookies);
            delete resp.cookies;
        }
        if (resp.headers !== undefined) {
            // if (resp.statusCode === 301) ClogTrace("Redirecting...");
            for (var hdr of Object.getOwnPropertyNames(resp.headers)) {
                // ClogTrace("Setting header ", hdr, resp.headers[hdr]);
                res.setHeader(hdr, resp.headers[hdr])
            }
            delete resp.headers;
            // console.log("past setting headers");
        }
        if (resp.statusCode !== undefined) {
            res.statusCode = resp.statusCode;
            delete resp.statusCode
        }

        if (resp.contentType !== undefined) {
            res.setHeader("Content-Type", resp.contentType);
            delete resp.contentType
        }
        if(resp.body) resp = resp.body;
    }
    // console.log("headers to be sent", res.getHeaders())
    // console.log("-- Sending response", resp)
    res.send(resp);
}

export default router
