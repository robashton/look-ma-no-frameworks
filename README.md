# What is this

- This is some code put together as part of a pairing exercise with a client
- This demonstrates how I put together a JS application organically over time
- This demonstrates roughly how you would do feature folders
- This demonstrates roughly how you would detach event listeners
- This demonstrates that Knockout is cool if you limit it to specific bits of an application
- This demonstrates that you don't need a fancy framework to build an application
- This is in no way complete, it answered the questions the team had - it may not answer yours

### Rules

- Presenters must be *given* the element they own
- Presenters must implement a detach method to clean up when done
- Presenters may create other elements, and pass them to sub-presenters
- The root presenter will call detatch and that will bubble down
- A routing engine would be responsible for switching top level presenters

This is backbone-ish, but without backbone. The gist being that most of the time you don't need any of that.
