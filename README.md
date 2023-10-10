# kwg-node-browser

Web service for viewing data about nodes

## Background

KnowWhereGraph has billions of data nodes, each with an attached HTTP URI. This web application provides an interface for viewing information attached to a particular node.

## Running

The node explorer can be run under several environments, which are defined as Angular environments under `src/app/environments`.

### Local Environment

The local environment assumes that the KnowWhereGraph stack is running locally, which includes an endpoint at `https://localhost/sparql`. It also redirects all web links to localhost.
```
ng serve --configuration=local
```

### Stage Environment

The stage environment uses the staging deployments SPARQL endpoint. It also redirects links to the staging server.

### Production Environment

The prod environment uses the production SPARQL endpoint and redirects to the production server.

### Custom

Changes can be made to any of these environments to mix and match behavior.

## Building & Deploying

When using the node explorer in a production environment, the source should be built and then served with a server like NGINX or Apache.

### Production

Production deployments should deploy the application by building and serving the distribution with a reverse proxy such as nginx or apache.

To build the node explorer,

```
ng build --configuration=production
```

This can also be done by using the Dockerfile for a more reliable build environment with

```
docker-compose -f docker-compose.prod.yaml up

```

### Staging

Staging builds are done similarly to production with

```
ng build --configuration=stage
```

This can also be done by using the Dockerfile for a more reliable build environment with

```
docker-compose -f docker-compose.stage.yaml up
```

## Developing

The standard Git Flow: create a feature branch off of the `develop` branch and make pull requests into it. For full releases, merge from the `develop` branch into `main`.

Before requesting a review, format the code with prettier: `npx prettier . --write`
