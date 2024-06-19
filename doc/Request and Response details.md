# Requests and Responses

When constructing web api functions, it is important to understand what the incoming event values are, and how to format 
values for the returned response.


## Request Event
This briefly describes what is contained in a MistLift compatible request that may come from a cloud request, a local server request, or
a locally run request via a json file.

This is the event object that is received by the 'main.ts' code of your function.  This occurs in this code:

    const service = new LambdaApi<any>(def,
        async (event:any) => {
            Log.Info("Entering Main", def, event)
            return Success("Hello,  World!")
        }
    )

This 'service' function will receive a 'def' parameter and an 'event' parameter within the scope of the main function
which begins in the example above with the `Log.Info` statement.

The 'def' parameter is a function definition.  This reflects the values of the definition.json file that is part of the 
function creation (see [Function Definition file](./Function%20Definition%20file.md)).

The 'event' parameter contains the values passed into the function from the request, and has this format:

    event: {
        request: {
            originalUrl: string -- this is the url that originated this request.
        },
        stage: string -- for AWS, this is the deployment stage of the API.  Currently, only 'Dev' is supported.
        cookies: {} -- an object with cookie values, by name
        parameters: {} -- an object with parameter values extracted from either uri path or query according to the function definition. For a local run, these values are set directly in the request.json
        headers: {} -- an object with header values, by name
        body: any -- if defined, this is the body of the request.
    }

### Setting a request event for a local run
when creating a named request file for local execution (e.g. request.json), we put most of the values the function is to receive
directly into the request object, under the property name "local". If the "originalUrl" value is desired to pass, it should be provided
as "request": { "orginalUrl": "..." }

for example:

    {
        "request": {
            "originalUrl": "http://localhost:8081/myfunction"
        },
        "local": {
            "parameters": {
                "foo": "bar",
                "bar": 42
            },
            "headers": {
                "Content-Type": "application/json",
                "X-MY-HEADER": "supercalifragilisticexpialidocious"
            },
            "cookies": {
                "incoming": "value"
            },
            "body": {
                "Fee": "fi",
                "Fo": "fum"
            }
        }
    }

## Responses

A response is sent as an object. The return value of the main entry point is the response. A basic response contains a statusCode, a body, and a content-type.
This could be specified as

 `return {statusCode: 200, body:"It's all good", content-type: "text/plain"}`

but there are convenience functions for common return cases, so the above could be more simply specified as:

  `return SUCCESS("It's all good")`

In such a case, the content-type is auto-derived based upon inspection of the returned body.
Properties other than statusCode, body, and content-type are undefined.

To declare a response object explicitly, set the corresponding properties accordingly:

- __statusCode__ - the HTTP response status code of the response (number)
- __contentType__ - the mime type (media type) of the response body
- __headers__ - name/value object containing headers to return with the response
- __cookies__ - name/value object containing set-cookie values to return with the response
- __body__ - The body content (if any) of the response. If the content is binary, this should be a Base64 encoded string.
- __isBinary__ - set true if the body is a Base64 encoded string representing binary content.

