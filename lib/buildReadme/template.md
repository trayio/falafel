# {{connectors.main.title}}

{{docs.intro}}

In this article:

{{#if connectors.trigger}}
* [Triggers](#triggers)
{{/if}}
* [Operations](#operations)
{{#if docs.auth}}
* [Authentication](#authentication)
{{/if}}
{{#if docs.quickstart}}
* [Getting started with the {{connectors.main.title}} connector](#getting-started-with-the-{{connectors.main.title}}-connector)
{{/if}}
{{#if docs.issues}}
* [Common issues](#common-issues)
{{/if}}


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
