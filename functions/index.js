const functions = require("firebase-functions");

const { ApolloServer } = require('apollo-server-cloud-functions');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema')

const { UsersAPI } = require('./datasources/users');
const { types } = require('./schema/schema');
const { resolvers } = require('./resolvers/resolvers');

const dataSources = () => ({
    usersAPI: new UsersAPI(),
});

const { authDirective } = require('./schema/auth'); 
const { authDirectiveTypeDefs, authDirectiveTransformer } = authDirective('auth')
  
let schema = makeExecutableSchema({
  typeDefs: [
    authDirectiveTypeDefs,
      types
  ],
  resolvers,
});
schema = authDirectiveTransformer(schema)

const server = new ApolloServer({
  schema,
  context: ({ req }) => ({
    user: {
      token: {
        role: 'therapist',
        uuid: 'gFNMd96BADdTeVsnfoo9HwoD9j03'
      }
    }
  }),
  introspection: true, 
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  dataSources, 
});

exports.graphql = functions.region('europe-west1').https.onRequest(server.createHandler());

