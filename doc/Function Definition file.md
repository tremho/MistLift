# Structure of a function definition.json file

The function definition file (definition.json) that accompanies each MistLift function created declares the API particulars
for that function, including its access method, URL, parameters, and return values.

It has the following properties:

- __name__ - Name of the function. This is usually the same as the name of the enclosing folder.
- __description__ - brief description of the function. Appears in OpenAPI (swagger) view.
- __version__ - the version (Semantic Versioning) of the function. Informational only.
- __pathMap__ - The path, with optional parameter placeholders.

URI - based parameters may be specified here, for example:

`/report/{classroom}/{student}`

would indicate that a uri of `/report/comp-sci/matheson` would pass the value 'comp-sci' to the parameter 'classroom'
and the value 'matheson' to the parameter 'student'

- __method__ - HTTP method this function is to be called by (GET, POST, PUT, DELETE, PATCH). 

- __timeoutSeconds__ -- number of seconds for timeout before function returns a response. If 0 or less, or not provided, the default is used (AWS default is 3). Has no effect on local server.

- __schemas__ - defines optional schemas describing object types of the function. Schemas may be referred to by name for return types.

example:

    "schemas": {
        "Student": {
            "firstName": "string",
            "lastName": "string",
            "age": "number"
        },
        "Valedictorian": {
            "year": "number",
            "student": "Student"
        }


- __parameters__ - an array of objects that define the parameters the function uses.

Each parameter object has the following properties
- ___name___ - name of the parameter
- ___type___ - parameter type (e.g. "string" or "number" or "bool")
- ___in___ - specifies where to find parameter ("path", "query", "body")
- ___description__ - a description of this parameter

and the following optional properties for default and validation features:

- ___default___ - value to use if parameter is undefined
- ___min___ - minimum value to validate parameter against
- ___max___ - maximum value to validate parameter against
- ___oneOf___ - string array of values parameter must be one of
- ___match___ - regular expression parameter must match against


Note that the "in" property values have these meanings:
- _path_ - parameter is mapped according to the `pathMap` property in the uri segment where this parameter name appears in brackets {}.
- _query_ - parameter is passed as a query string (e.g. ?param1=foo&param2=bar&param3=baz)
- _body_ - parameter value can be found within the request body object by name

- __returns__ - an object with properties per status code defining the type/schema returned for this case and a description.

Example 1:

    "200": {
        "type": "empty",
        "description": "successful response."
    },
    "500": {
        "type": "string",
        "description": "Error details"
    }

Example 2:

    "200": {
        "type": "Valedictorian",
        "description": "returns valedictorian for the given year"
    },
    "500": {
        "type": "string",
        "description": "Error details"
    }
