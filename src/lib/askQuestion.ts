/** handles interaction for asking a question */

import * as ac from "ansi-colors"
const readlineSync = require("readline-sync")

export function ask(
    desc:string, // describes the context
    query:string,  // asks the actual question
    def:string // default answer

) :string // answer provided
{
    console.log(ac.dim.blue.italic(desc))
    let answer = readlineSync.question(ac.bold.green(query) + ac.dim.grey(` [${def}] `)+ '? ')
    if(!answer) answer = def
    return answer
}

