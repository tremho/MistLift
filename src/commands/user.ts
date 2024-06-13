/** Handles the set of user management commands
 *
 * Default and prime user is the default of the AWS profile set
 * In configuration, this can be changed to a different profile
 * The user command module is meant to
 */

import * as path from 'path'
import * as fs from 'fs'

export function doUser(command:string, args?:string|string[])
{
    if(typeof args === "string") {
        args = [args]
    }
    var value = (args as string[])[0];
    switch(  command.toLowerCase()) {
        case 'create':
            createUser(value);
            break;
        case: 'destroy':
            removeUser(value);
            break;
        case 'grant':
            grantPrivilege(user, value);
            break;
        case 'revoke':
            break;
        case 'show':
            break;
        case 'list':
            break;
/*
- lift user create <name>
- lift user destroy <name>
- lift user grant <name> <privilege>
- lift user revoke <name> <privilege>
- lift user show <name>
- lift user list

 */
    }
}