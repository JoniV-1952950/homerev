const functions = require("firebase-functions");
const admin = require('firebase-admin');
const { getAuth } = require("firebase-admin/auth");

admin.initializeApp(); 

const { ApolloServer } = require('apollo-server-cloud-functions');
const { ApolloServerPluginLandingPageGraphQLPlayground, AuthenticationError } = require('apollo-server-core');
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
  context: async ({ req }) => {
    const token = req.headers.authorization || '';
    if(token == "")
      throw new AuthenticationError("No token provided");
    try {
      const userVerified = await getAuth().verifyIdToken(token);
      return { user: {
        uid: userVerified.uid,
        role: userVerified.role
      } 
    };
    } catch(error) {
      throw new AuthenticationError("Invalid token");
    }
  },
  introspection: true, 
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground(),
  ],
  dataSources, 
});

exports.graphql = functions.region('europe-west1').https.onRequest(server.createHandler());

