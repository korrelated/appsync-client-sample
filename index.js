"use strict";
/**
* This shows how to use standard Apollo client on Node.js
*/

global.WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');

// Require exports file with endpoint and auth info
const aws_exports = require('./aws-exports').default;

// Require AppSync module
const AUTH_TYPE = require('aws-appsync').AUTH_TYPE;
const AWSAppSyncClient = require('aws-appsync').default;

const url = aws_exports.ENDPOINT;
const region = aws_exports.REGION;
const type = AUTH_TYPE.API_KEY;
const apiKey = aws_exports.API_KEY;

// Import gql helper and craft a GraphQL query
const gql = require('graphql-tag');
const query = gql(`
query AllPrincipals {
getManyPrincipals {
    id
    username
}
}`);

// Set up a subscription query
const onCreateQ = gql(`
subscription NewPrincipalSub {
onCreatePrincipal {
    id
    username
}
}`);

const onDeleteQ = gql(`
subscription DeletePrincipalSub {
onDeletePrincipal
}`);

// Set up Apollo client
const client = new AWSAppSyncClient({
    url: url,
    region: region,
    auth: {
        type,
        apiKey
    },
    disableOffline: true      //Uncomment for AWS Lambda
});

client.hydrated().then(function (client) {
    //Now run a query
    //client.query({ query: query })
    client.query({ query: query, fetchPolicy: 'network-only' })   //Uncomment for AWS Lambda
        .then(function logData(data) {
            console.log('results of query: ', data.getManyPrincipals);
        })
        .catch(console.error);

    //Now subscribe to results
    const onCreate = client.subscribe({ query: onCreateQ });

    const createResults = function createResults(data) {
        console.log('realtime data: ', data);
    };

    onCreate.subscribe({
        next: createResults,
        complete: console.log,
        error: console.log,
    });

    const onDelete = client.subscribe({ query: onDeleteQ });

    const deleteResults = function deleteResults(data) {
        console.log('realtime data: ', data);
    };

    onDelete.subscribe({
        next: deleteResults,
        complete: console.log,
        error: console.log,
    });
});