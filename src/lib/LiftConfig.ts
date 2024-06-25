// configuration for setting cloud provider credentials
// may expand later for other MistLift settings/preferences

import path from "path";
import fs from "fs";
import AWS, {fromIni} from '@aws-sdk/credential-providers';
import {NodeJsRuntimeStreamingBlobTypes} from "@smithy/types";

let s_liftConfigLoaded:LiftConfig|null = null;

// Defines the structure of the .mistlft json file
// All relevant configuration for the cloud host goes here
export class LiftConfig {
    public cloudHost: string = "AWS" // all we support now
    public awsIniProfile?: string
    public awsPreferredRegion?:string
    public awsNodeRuntime?: RuntimeType
    public awsServiceRoleARN?:string
}
export type RuntimeType = "nodejs" | "nodejs4.3" | "nodejs6.10" | "nodejs8.10" | "nodejs10.x" | "nodejs12.x" | "nodejs14.x" | "nodejs16.x" | "java8" | "java8.al2" | "java11" | "python2.7" | "python3.6" | "python3.7" | "python3.8" | "python3.9" | "dotnetcore1.0" | "dotnetcore2.0" | "dotnetcore2.1" | "dotnetcore3.1" | "dotnet6" | "dotnet8" | "nodejs4.3-edge" | "go1.x" | "ruby2.5" | "ruby2.7" | "provided" | "provided.al2" | "nodejs18.x" | "python3.10" | "java17" | "ruby3.2" | "ruby3.3" | "python3.11" | "nodejs20.x" | "provided.al2023" | "python3.12" | "java21";

// Available for general use because, why not?
export function getUserHome() {
    return process.env.HOME ?? process.env.HOMEPATH ?? process.env.USERPROFILE ?? "~";
}

export function LoadLiftConfig() : LiftConfig|null
{
    if(!s_liftConfigLoaded) {

        const mistlift = path.join(getUserHome(), ".mistlift");
        let configJson = "{}";
        if (fs.existsSync(mistlift)) {
            try {
                configJson = fs.readFileSync(mistlift).toString();
                s_liftConfigLoaded = JSON.parse(configJson);
            } catch (e: any) {
                //
            }
        }
    }
    return s_liftConfigLoaded
}
export function resetLiftConfig()
{
    s_liftConfigLoaded = null;
}

export function areSettingsAvailable():boolean {
    const mistlift = path.join(getUserHome(), ".mistlift");
    return fs.existsSync(mistlift);
}

export function getSettings() : LiftConfig {
    if (s_liftConfigLoaded == null) LoadLiftConfig();
    return s_liftConfigLoaded as LiftConfig
}

/**
 * Return the credentials required for AWS based upon our config options.
 *
 * We will use the standard .aws config ini file, looked up by profile or default
 * Prior attempts to have it do more than this failed, and resulted in a default profile choice anyway.
 */
export function getAWSCredentials() : any
{
    let config = LoadLiftConfig()
    if(!config) {
        // console.error("No .mistlift configuration found - using AWS default profile");
        config = { cloudHost: "AWS", awsIniProfile: "default" }
    }
    if (config.cloudHost?.toUpperCase() !== "AWS")
    {
        throw Error("HostType Not Supported");
    }
    let credentials = {};
    const profile = config.awsIniProfile ?? "default"
    if(profile) {
        credentials = fromIni({profile})
    }

    return credentials;
}
