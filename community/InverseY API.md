# Inverse-Y
@tremho/inverse-y npm library is packaged with deployed apps. Contains integration handling for AWS lambda services, which is used by implementation
and functions available for apps to use both locally and deployed.

These are used by the AWS integration
## LambdaApi,
The AWS server-side function handling
#### Handler,
Specifies the handler callback itself
####  ParamDef,
Specifies the definition of a parameter as used in definition.json
#### ParamSet,
Specifies a set of parameters
#### ReturnDef,
Specifies the definition of a return type
#### RequestEvent,
Specifies the details of a request passed to the handler
#### ServiceDefinition,
Specifies the full structure of the definition.json file
#### AwsStyleResponse
Specifies the response as used by AWS

These may be used by the user app for return types
## Responses
Shorthand wrappers for common response types
#### Success,
Successful request
#### BadRequest,
Request was ill-formed
#### Unauthorized,
Request is unauthorized
#### Forbidden,
Content is forbidden to this user
#### NotFound,
Content is unknown, not found
#### MethodNotAllowed,
The request method is not supported for this operation
#### ServerError,
An unspecified error has caused an exception in the server code
#### ServerException,
A specified error was caused by an exception
#### NotImplemented
The operation requested is not implemented

These may be used by the user app. Also used internally.
## Logging
Logging it most commonly accessed via the Log object
### LogLevel
Trace, Debug, Info, Warning, Error, Exception, Critical
#### Log,
Log.Trace, Log.Debug, Log.Info, Log.Warning, Log.Error, Log.Exception, Log.Critical
#### LogAtLevel,

#### ClearLogs,

#### setLoggingLevel,

#### collectLogs

