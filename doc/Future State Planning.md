# MistLift future plans and ideas

Please see the [issues page](https://github.com/tremho/MistLift/issues) for more details.

## Hot Watch
Currently, one must start the local server with `lift start` to build and
expose the API via the local server.  
Ideally, a file watcher would be implemented that would restart the server
and force an automatic reload of any attached browser.
This is a feature common to many front-end development frameworks, and
would be most welcome here as well.

## User Management
Access to the AWS cloud is managed by the user's root level AWS credentials
and as configured in -- TODO --

However, for team efforts, and/or managing multiple projects, a finer level of
user control is desired.
The AWS user management is sufficent for this, but there needs to be command-level
access to these features that are easy to use.
The vision for this is to create a `lift user` command with subcommands for each action,
such as:
- `lift user create` - create a user within the account, with minimal or default access
- `lift user destroy` - destroy a user from the account
- `lift user grant` - grant access permissions
- `lift user revoke` - revoke access permissions
- `lift user show` - show user details
- `lift user list` - list active users
- `lift user login` - login as a user

Best practices and security considerations for the above are important to research
and consider.

## Other stacks
The current progamming stack supported is NodeJS.  This has been supported as
an AWS Lambda technology for some time now.
Other stacks are supported by AWS and should be relatively similar to support
by MistLift.

AWS supports Java, Go, PowerShell, Node.js, C#, Python, and Ruby code.

Preference would be to support these in this order

- [X] NodeJS
- [ ] .NET (C#)
- [ ] Python
- [ ] Java
- [ ] Go
- [ ] Ruby
- [ ] Powershell (_really?_)

For each stack, there needs to be a local server that can run the function code
created, in the same way the Express server works for the NodeJS stack.

Switching stacks could be done via a configuration and/or a command
that effectively changes this config setting.

Probably each stack would be contained within its own module and switched into scope
accordingly.  Open to ideas on architectural approaches here.

## Azure and other clouds

MistLift targets AWS, but the concepts apply to Azure as well.

- Identifying the parallels (Azure Functions <==> AWS Lambda, etc)
- Deployment processes
- Supportable stacks (looks pretty much identical at a glance)
- Root and account users  

Cloud host selection would switch in a manner similar to stack selection,
although note the combination produces a matrix of configurable possibilities.


## Your ideas
This is an open source project intended to be community driven.  So where does
your imagination go when you think about what this project can feature and what it can do?

Add your ideas to the issues list or reach out to one of the principals directly
with your thoughts.


