# Overview

An uptime monitoring RESTful API server that allows authenticated users to monitor URLs, and get detailed uptime reports about their availability, average response time, and total uptime/downtime. When a url fails the desired number of checks, an email is sent, and a webhook can be supplied too.

Table of contents
- [API Documentation](#api-documentation)
- [Development Notes](#development-notes)

## Note
- The file [nodejs_client.js](./nodejs_client.js) contains a client that could be used to try out the API server. Just fill in `postData`, `path`, and `method`.


## API Documentation

- The server url is `https://immense-dawn-06846.herokuapp.com/` ; all endpoints mentioned below come after that url
- The server accepts and produces application/json
- All server responses to `POST` , `PUT` , `DELETE` requests
  - will have an OK status code (200-299) for a successful action and any status code otherwise
  - will contain a `message : <message>` in the body to confirm a successful action or to state the reason of an error
  - might have additional content in the body (mentioned below case-by-case)



**1. Sign up**
- `POST` to `/user/signup`
- body
  - `email` : your email
- if successful, a verification code is sent to your inbox
- code expires after 10 minutes and you will need to sign up again to send a new verification code



**2. Verify email**
- `POST` to `/user/verify`
- body
  - `email` : email used for signing up
  - `verification_code` : paste verification code sent to email
  - `password` : your desired password



**3. Login**
- `POST` to `/user/login`
- body
  - `email` : verified email
  - `password` : password entered while verifying
- if login is successful, response body will contain a `token : <authorization_token>` that must be attached
to the body of ANY type of request to the routes `/check` and `/report` described below
- The token expires after 1 hour and you will need to login again to generate a new token



**4. Add a new check**
- `PUT` to `/check`
- body
  - `token` : authorization token
  - `check` :
    - `name`: used as the unique identifier of the check *(required)*.
    - `url`: The URL to be monitored *(required)*.
    - `protocol`: The resource protocol name `HTTP`, `HTTPS` *(required)*.
    - `path`: A specific path to be monitored *(optional)*.
    - `port`: The server port number *(optional)*.
    - `webhook`: A webhook URL to receive a notification on *(optional)*.
    - `timeout` *(in seconds, must be >=5, defaults to 5 seconds)*: The timeout of the polling request *(optional)*.
    - `interval` *(in minutes, must be >=0.5, defaults to 0.5 minutes)*: The time interval for polling requests *(optional)*.
    - `threshold` *(defaults to 1 failure)*: The threshold of failed requests that will create an alert *(optional)*.
    - `authentication`: An HTTP authentication header, with the Basic scheme, to be sent with the polling request *(optional)*.
      - `authentication.username`
      - `authentication.password`
    - `httpHeaders`: A list of key/value pairs custom HTTP headers to be sent with the polling request *(optional)*.
    - `assert`: The response assertion to be used on the polling response *(optional)*.
      - `assert.statusCode`: An HTTP status code to be asserted.
    - `tags`: A list/array of the check tags *(optional)*.
    - `ignoreSSL`: A flag to ignore broken/expired SSL certificates in case of using the HTTPS protocol *(optional)*.
- repeating a `PUT` request for a check with an existing `name` will update that check with any changed attributes
- updating a check will reset its report i.e. lose all data of the report associate with the old check
- if successful, the check will be start executing immediately and a corresponding report (described below) will be created and updated continuously



**5. Get check information**
- `GET` to `/check`
- body
  - `token` : authorization token
  - `name` : name of check to get one check only (returns one document)
  - `tags` : array of tags to get all checks that satisfy all tags (returns array)
  - not supplying `name` nor `tags` will get all checks you added (returns array)

**6. Delete check**
- `DELETE` to `/check`
- body
  - `token` : authorization token
  - `name` : name of check you want to delete

**7. Get report information**
- `GET` to `/report`
- body
  - `token` : authorization token
  - `name` : get report of check with that name (returns one document)
  - `tags` : get all reports for checks that satisfy these tags  (returns array)
  - not supplying `name` nor `tags` will get all reports of all checks you added (returns array)
- structure of a returned report
  - `status`: The current status of the URL.
  - `availability`: A percentage of the URL availability.
  - `outages`: The total number of executed checks that discovered URL is down.
  - `downtime`: The total time, in seconds, of the URL downtime.
  - `uptime`: The total time, in seconds, of the URL uptime.
  - `responseTime`: The average response time for the URL in milliseconds.
  - `history`: Array of timestamped logs of the polling requests.

## Development Notes
- What would make this uptime monitor much better?
  - Separating the monitoring service (`Monitor` object in [monitor.js](./monitor)) from the CRUD service. As it stands now, the monitoring service (where the url checks are done, and the timers are stored) is in the same process as the CRUD service (where signing up process, adding checks, updating reports etc. are done). This separation will simply minimize tasks that might add to delays in the monitoring service.
  - Using an in-memory store like Redis in the monitoring service to store the timers and information relating to checks. As it stands now, all this information is stored in the Node.js process memory.
  - Add a feature to the monitoring service that tracks how many connections are alive at the same time to make sure that the amount of live connections do not explode. As it stands now, the only 'protection' against this is preventing polling requests to have an interval less than 30s.
