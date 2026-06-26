import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local as MONGODB_URI');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable so the MongoClient
    // is not recreated on every hot reload
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production, always create a new client
    client = new MongoClient(uri);
    clientPromise = client.connect();
}

export default clientPromise;
