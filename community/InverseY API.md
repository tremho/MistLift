# Inverse-Y
Packaged with deployed apps. Contains integration handling for AWS lambda services, which is used by implementation
and functions available for apps to use both locally and deployed.

These are used by the AWS integration
## LambdaApi,
#### Handler,
####  ParamDef,
#### ParamSet,
#### ReturnDef,
#### RequestEvent,
#### ServiceDefinition,
#### AwsStyleResponse

These may be used by the user app for return types
## Reponses
#### Success,
#### BadRequest,
#### Unauthorized,
#### Forbidden,
#### NotFound,
#### MethodNotAllowed,
#### ServerError,
#### ServerException,
#### NotImplemented

These may be used by the user app. Also used internally.
## Logging
### LogLevel
#### Log,
#### LogAtLevel,
#### ClearLogs,
#### setLoggingLevel,
#### collectLogs

----

May include. But only strictly needed for sessions

## TimeHelper
#### nowSeconds,
#### nowSecondsHex,
#### secondsFromHex


## S3Actions
#### serialize,
#### deserialize,
#### s3PutObject,
#### s3PutText,
#### s3GetResponse,
#### s3Delete,
#### s3GetObject,
#### s3GetText,
#### s3ResolveResponseObject


----

Part of session support - split to separate package

## ServerInstance

## Session
#### Session,
#### sessionGet,
#### sessionSave,
#### sessionDelete,
#### sessionIsValid

## Login
#### loginBegin,
#### loginWaitFinish

## SiaToken / SlotData
#### SlotData,
#### createSiaToken,
#### getSlotIdFromToken,
#### reserveSlotForSIA,
#### getSlotData


