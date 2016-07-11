# {{connectors.main.title}}

{{docs.intro}}

***

## Triggers

{{#each connectors.trigger.messages}}
{{#if description}}
* __{{{title}}}:__ {{{description}}}
{{else}}
* __{{{title}}}__
{{/if}}
{{/each}}

***

## Operations

{{#each connectors.main.messages}}
{{#if description}}
* __{{{title}}}:__ {{{description}}}
{{else}}
* __{{{title}}}__
{{/if}}
{{/each}}


{{#if docs.auth}}
***

## Authentication

{{{docs.auth}}}
{{/if}}

{{#if docs.quickstart}}
***

## Getting started with the {{connectors.main.title}} connector

{{{docs.quickstart}}}
{{/if}}


{{#if docs.issues}}
***

## Common issues

{{{docs.issues}}}
{{/if}}
