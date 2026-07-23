import { MongoClient } from "mongodb";
import {
  MONGODB_URI,
  MONGODB_DB_NAME,
  MONGODB_COLLECTION,
  MONGODB_USERS_COLLECTION,
  MONGODB_PROGRAMS_COLLECTION,
  MONGODB_UNITS_COLLECTION
} from "./constants.js";
import { readLanguagesFromFile } from "../services/fileStorage.js";

let mongoClient = null;
export let languagesCollection = null;
export let usersCollection = null;
export let programsCollection = null;
export let unitsCollection = null;

export async function initStorage() {
  if (!MONGODB_URI) {
    console.log("MONGODB_URI not found in .env, using JSON file storage.");
    return;
  }

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();

  const db = mongoClient.db(MONGODB_DB_NAME);
  languagesCollection = db.collection(MONGODB_COLLECTION);
  usersCollection = db.collection(MONGODB_USERS_COLLECTION);
  programsCollection = db.collection(MONGODB_PROGRAMS_COLLECTION);
  unitsCollection = db.collection(MONGODB_UNITS_COLLECTION);

  const count = await languagesCollection.countDocuments();
  if (count === 0) {
    const seedItems = await readLanguagesFromFile();
    if (seedItems.length > 0) {
      await languagesCollection.insertMany(seedItems);
    }
  }

  console.log(`Connected to MongoDB database: ${MONGODB_DB_NAME}`);
}
