
import Tap from "tap"
import {start} from './src/main'
import {TapAssert} from '@tremho/tap-assert'
import path from 'path'

async function test(t:any) {

    const assert = new TapAssert(t);

    // empty event defaults. change this if you want to pass other request values for testing
    const event= {
                  request: {
                      originalUrl: ''
                  },
                  // stage: '',
                  cookies: {},
                  parameters: {},
                  headers: {}
                  // body: ''
              }
    const resp = await start(event, {}, null)

    // Tests for the 'Hello, World!' placeholder response
    assert.isType(resp, 'object', 'response is an object')
    assert.isEqual(resp.statusCode, 200, 'Success response')
    assert.isEqual(resp.headers['content-type'], 'text/plain', 'plain text content')
    assert.isType(resp.body, 'string', 'Response has a body')
    assert.isFalse(resp.isBase64Encoded, 'result not binary')
    assert.meetsConstraints(resp.body, 'startsWith=Hello', 'content appears correct')

    t.end()

}
Tap.test(path.basename(__filename), t => {
    test(t)
})
