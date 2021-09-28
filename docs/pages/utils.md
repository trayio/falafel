---
layout: default
title: Utils
nav_order: 4
description: Falafel provides a few utility function to aid with connector development.
permalink: /utils
---

# Utility functions
Falafel provides a few utility function to aid with connector development.

## Threadneedle
*falafel.utils.threadneedle*
### smartSubstitution
[*falafel.utils.threadneedle.smartSubstitution*](lib/rawHttpRequest/smartSubstitution.js)

As of Threadneedle v1.11.0 and Falafel v1.25.0, the `smartSubstitution` exposed by Threadneedle is included as part of Falafel's utility functions. For documentation, see [here](https://github.com/trayio/threadneedle/blob/master/smartSubstitution.md).


## Protected Service
*falafel.utils.protectedService*

### validateRequestAgainstWhitelistedUrls
[*falafel.utils.protectedService.validateRequestAgainstWhitelistedUrls*](lib/protectedService/validateRequestAgainstWhitelistedUrls.js)

If the service is protected and configured (which is derived from `#auth_app` from `params`), then this function will validate the request before allowing it to execute. The function accepts the same arguments as `beforeRequest`.

## Raw HTTP Request
See [Raw HTTP Request](rawHttpRequest.md#utils) documentation.
