---
layout: default
title: OneOf inputs
nav_order: 3
description: "How to utilise oneOf schemas for more input flexibility."
parent: Input Schema
permalink: /input-schema/oneof
---

# oneOf Schemas

Firstly, it should be understood that the `oneOf` implementation/intended use in [tray.io](http://tray.io) is different from the JSON schema specification; 
i.e. whereas the JSON schema spec primarily uses `oneOf` for validation purposes,
FE and properties panel uses `oneOf` to actually generate a form.

The general issue surrounding `oneOf`  is that for child schema options that are the same/similar,
there is no easy way to differentiate between those options from a data PoV,
especially given FE does not store metadata regarding the selection.
This consequently can cause issues; on refresh for example,
FE will default to the first child schema that is a match to the saved input/data.

It is therefore necessary to make the `oneOf` child schemas unique in some manner,
so that differentiation and therefore identification is possible.
Additionally, note that required vs optional properties influence uniqueness.
