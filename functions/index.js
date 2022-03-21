const functions = require("firebase-functions");

const { ApolloServer } = require('apollo-server-cloud-functions');
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const { makeExecutableSchema } = require('@graphql-tools/schema')

const { UsersAPI } = require('./datasources/users');
const { MedAPI } = require('./datasources/med');
const { types } = require('./schema/schema');
const { resolvers } = require('./resolvers/resolvers');

const dataSources = () => ({
    usersAPI: new UsersAPI(),
    medAPI: new MedAPI()
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
      role: 'patient',
      uuid: 'GaYj5nPXWJQ207DODA5TMwPEbnA2'
    }
  }),
  introspection: true, 
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  dataSources, 
});

exports.graphql = functions.region('europe-west1').https.onRequest(server.createHandler());

