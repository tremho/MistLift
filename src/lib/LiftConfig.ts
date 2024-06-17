// configuration for setting cloud provider credentials
// may expand later for other MistLift settings/preferences

import path from "path";
import fs from "fs";
import AWS, {fromIni, fromTemporaryCredentials} from '@aws-sdk/credential-providers';

let s_liftConfigLoaded:LiftConfig|null = null;

// Defines the structure of the .mistlft.json file
export class LiftConfig {
    public CloudHost:CloudHost = new CloudHost()
}
// All relevant configuration for the cloud host goes here
export class CloudHost {
    public hostType: string = "AWS"; // all we support now
    public AWS:AWSHostOptions = new AWSHostOptions()
}

// HostOptions per host type (in this case, AWS)
// if no profile and no config.json, will attempt to use profile "default"
// if config.json is provided and exists, profile choice is ignored.
export class AWSHostOptions {
    public useAWSIniProfile:string = "default" // or name, or null/empty for none
    // public useAWSConfigPath:string = "" // path to aws credentials config.json or null/empty for none
}
// format for the AWS credential config.json style file noted above.
// export class AWSConfig {
//     public accessKeyId:string = ""
//     public secretAccessKey:string = ""
//     public region:string = ""
// }

// Available for general use because, why not?
export function getUserHome() {
    return process.env.HOME ?? process.env.HOMEPATH ?? process.env.USERPROFILE ?? "~";
}

export function LoadLiftConfig() : LiftConfig|null
{
    if(!s_liftConfigLoaded) {

        const mistlift = path.join(getUserHome(), ", mistlift.json");
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

/**
 * Return the credentials required for AWS based upon our config options.
 */
export function getAWSCredentials() : any
{
    // TODO: replace use of Error with custom Exceptions

    let config = LoadLiftConfig();
    if(!config) {
        // console.error("No .mistlift configuration found - using AWS default profile");
        config = { CloudHost: {hostType: "AWS", AWS: { useAWSIniProfile: "default"}}}
    }
    if (config.CloudHost?.hostType?.toUpperCase() !== "AWS")
    {
        throw Error("HostType Not Supported");
    }
    const awsOptions = config?.CloudHost?.AWS ?? {}
    const profile = awsOptions.useAWSIniProfile ?? "default"
    let credentials = fromIni({profile})
    return credentials;
}
