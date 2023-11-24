import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { Db, MongoClient } from "mongodb";
import { GraphQLError } from "graphql";
import { Pet } from "./types.ts";
import mongoose from "npm:mongoose";

// Connection URL
const url = "mongodb://localhost:2900";
const dbName = "Animales"; // Replace with your actual database name

await mongoose.connect(
  `mongodb+srv://peter:1234@cluster0.vueih6l.mongodb.net/Animales?retryWrites=true&w=majority`,
);

// Function to connect to MongoDB
async function connectToDatabase(): Promise<Db> {
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log("Connected to the database");
    return client.db(dbName);
  } catch (error) {
    console.error("Error connecting to the database", error);
    throw error;
  }
}

// The GraphQL schema
const typeDefs = `#graphql
  type Pet {
    id: ID!
    name: String!
    breed: String!
  }
  type Query {
    hello: String!
    pets: [Pet!]!
    pet(id: ID!): Pet!
  }
  type Mutation {
    addPet(id: ID!, name: String!, breed: String!): Pet!
    deletePet(id: ID!): Pet!
    updatePet(id: ID!, name: String!, breed: String!): Pet!
  }
`;

// A map of functions which return data for the schema.
const resolvers = {
  Query: {
    hello: () => "world",
    pets: async () => {
      return petCollection.find().toArray();
    },
    pet: async (_: unknown, args: { id: string }) => {
      const pet = await petCollection.findOne({ id: args.id });

      if (!pet) {
        throw new GraphQLError(`No pet found with id ${args.id}`, {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return pet;
    },
  },
  Mutation: {
    addPet: async (
      _: unknown,
      args: { id: string; name: string; breed: string },
    ) => {
      const pet = {
        id: args.id,
        name: args.name,
        breed: args.breed,
      };

      await petCollection.insertOne(pet);
      return pet;
    },
    deletePet: async (_: unknown, args: { id: string }) => {
      const pet = await petCollection.findOne({ id: args.id });

      if (!pet) {
        throw new GraphQLError(`No pet found with id ${args.id}`, {
          extensions: { code: "NOT_FOUND" },
        });
      }

      await petCollection.deleteOne({ id: args.id });
      return pet;
    },
    updatePet: async (
      _: unknown,
      args: { id: string; name: string; breed: string },
    ) => {
      const pet = await petCollection.findOne({ id: args.id });

      if (!pet) {
        throw new GraphQLError(`No pet found with id ${args.id}`, {
          extensions: { code: "NOT_FOUND" },
        });
      }

      await petCollection.updateOne({ id: args.id }, {
        $set: { name: args.name, breed: args.breed },
      });
      return { ...pet, name: args.name, breed: args.breed };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const serverInfo = await startStandaloneServer(server, {
  listen: {
    port: 2900,
  },
});

console.log(`🚀 Server ready at ${serverInfo.url}`);
