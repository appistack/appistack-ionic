## Appistack Ionic

An ionic implementation of [appistack-angular](https://github.com/appistack/appistack-ng).

### Current Issues

So this runs with `ionic serve`, but I'm seeing some different behavior in the emulators.  Neither platforms render
static images stored within the applcation bc .. I have no idea.  Otherwise, the app works fairly well on iOS, until
you try to access a screen that uses WebAudio.  Then Angular crashes.  On Android, the app doesn't retain login data
after logging in.  Headers aren't passed to the API on subsequent requests.  This would be *super fun* to track down
using a remote chrome debugging instance.

### Configuring For Multiple Environments

#### 1) Configure DNS For Your API

In staging & production, you can connect to your API running in Heroku.  In development, you can either connect to one
hosted on Heroku or just spin one up on your local machine.  If you're running on an emulator, you'll likely need to
use an IP address for the API.

#### 2) Configure Constants for your environment.

There are three environments set up in `./config.json` - development, staging and production.  Values set for each
environment will override those in `common`.

`apiProtocol` - Used to specify http or https for you API.

`apiHost` - Your API's host, including the port number.

`apiUrl` - The path of your root API requests.  Default is `/api/v1`, which may be changed in favor of specifying version in the header.

`webUrl` - The full URL to your angular web application.  This is used by `$authProvider` for  `confirmationSuccessUrl` and `passwordResetSuccessUrl`.

`assetsUrl` - The root location for your static assets.

#### 3) Configure Your Static Assets Host

This application depends on loading static assets from your webserver, eventually S3 or another provider.  So you'll need
  to spin up whatever host you have configured for static assets.

#### 4) Configure CORS On Your Static Assets Hosting Provider

When running with `ionic serve` or running on a device with livereload, your application's requests will be required
to conform to CORS.  When running on a device or emulator, they need not.  While images won't give you any problems, CORS
is an issue because the MP3 assets must be downloaded with an XMLHTTPRequest.

If you run into issues getting this to run, read the Ionic team's [blog on handling CORS](http://blog.ionic.io/handling-cors-issues-in-ionic/).

### Useful Articles

http://www.betsmartmedia.com/what-i-learned-building-an-app-with-ionic-framework