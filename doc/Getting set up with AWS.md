# Getting set up with AWS

Here is some brief information about how to set up an AWS account so that you
are ready to use MistLift for the cloud.

Note that you are able to use MistLift for local development without setting up
a Cloud provider.

## Obtaining an AWS account

The MistLift features -- Lambda functions, and API Gateway are AWS Features that 
are considered a part of the AWS "Free Tier".

In practice, depending upon how you set up your AWS infrastructure, and how much traffic your
services receive, the cost of maintaining your cloud infrastructure on AWS may not always
remain literally free, but unless you add additional features, or experience very high traffic, this should not amount to more than a few dollars per month.
At any rate, AWS offers a 12-month free subscription to new users, so you have time to explore and
experiment before being charged.

Follow the instructions and informational guides for the [AWS Free Tier](https://aws.amazon.com/free/)

In summary, your steps will be:
- Supply and Verify your email address
- Create a password and set up MFA access protections
- Add a payment method for charges that may occur outside of the free-tier scope.
- Wait a day or two for account activation to finalize

More details are found in the Amazon Web Services online resources.

## Using the Console

Once your account is established,  you will use the [AWS Console](https://console.aws.amazon.com)
to log in and configure  your AWS usage.

You will need to think about which region you intend to deploy your services (east or west).
Services are accessible from anywhere regardless, but performance is better when end-to-end exchange
is within the same region.

MistLift will create Lambda functions and an API Gateway within your account when 
you deploy your functions and publish your API.

## AWS Configuration files and profiles

MistLift will use information from the `.aws/credentials` file.  This file may be found
in your User Home directory under the (possibly hidden) folder named .aws.  There may be other files
here as well, or this file or the .aws directory may not exist.

If you install the [AWS CLI support]()
you should find this file established for you.  
Alternately, you can create this file and folder yourself.

Please see the [Configuration and credential file settings](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
page at Amazon for more information about this INI-style file that is divided into different
profiles, including the `[default]` profile.

MistLift will use this file as it calls upon the AWS SDK functions to obtain your access credentials.


## Creating a Lambda service role

Prior to using MistLift for deployment, you must create a "Service Account Role"
that is to be assigned to your deployed Lambda function.

To do this, go to the Console, select IAM, then Roles, and Create Role.

Name the role something you will remember it by, such as "mistlift-service-role".

Assign to it full access for Lambda and for API Gateway.  If your functions will be using
other Amazon service resources (such as S3), you can set these permissions as well.  You can
come back and add these additional permissions later if you like also.

Once the role is created, look at its info page and make a note of the ARN value presented there.

It should have the form arn:aws:iam::xxxxxxxxxxxx:role/your-role-name

You will use this later when establishing Mistlift settings.

## Entering your info into settings

Access MistLift settings with the command `lift settings`.
Answer the questions, supplying the values from your AWS setup as requested.

You are now ready to use MistLift!



