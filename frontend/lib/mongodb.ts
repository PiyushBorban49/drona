import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
let clientPromise: Promise<MongoClient>;

async function connectToMongo() {
    const options = {
        family: 4,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        tlsAllowInvalidCertificates: true, // Always allow in dev/local to bypass common SSL issues
        tls: true,
    };

    try {
        console.log('Attempting MongoDB connection (SRV)...');
        const client = new MongoClient(uri, options);
        return await client.connect();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // If it's an SSL/SNI issue, try the standard connection string fallback
        if (errorMessage.includes('SSL alert number 80') || errorMessage.includes('SSL') || errorMessage.includes('Server selection timed out')) {
            console.warn('SRV connection failed or SSL error. Attempting Standard Connection String fallback...');

            // Better host resolution attempt
            const clusterPart = uri.match(/@([^/]+)\//)?.[1] || 'cluster0.hl1idof.mongodb.net';
            const baseHost = clusterPart.replace('mongodb+srv://', '');

            // Standard Atlas shard patterns and the specific ones from previous version
            const baseClusterName = baseHost.replace('.mongodb.net', '');
            const hostPatterns = [
                `${baseClusterName}-shard-00-00.hl1idof.mongodb.net:27017`,
                `${baseClusterName}-shard-00-01.hl1idof.mongodb.net:27017`,
                `${baseClusterName}-shard-00-02.hl1idof.mongodb.net:27017`,
                'ac-hnpi7ia-shard-00-00.hl1idof.mongodb.net:27017',
                'ac-hnpi7ia-shard-00-01.hl1idof.mongodb.net:27017',
                'ac-hnpi7ia-shard-00-02.hl1idof.mongodb.net:27017'
            ];

            // Extract credentials and DB name from the SRV URI
            const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
            if (match) {
                const [, user, pass, , dbname] = match;
                // Try standard connection string with all potential shard hosts
                const standardUri = `mongodb://${user}:${pass}@${hostPatterns.join(',')}/${dbname}?ssl=true&authSource=admin&retryWrites=true&w=majority`;

                console.log('Trying Standard URI with multiple host patterns...');

                try {
                    const fallbackClient = new MongoClient(standardUri, {
                        ...options,
                        serverSelectionTimeoutMS: 10000,
                    });
                    return await fallbackClient.connect();
                } catch {


                    console.error('Standard Connection fallback also failed.');

                    // Final Hail Mary: try direct connection to the main cluster URL (sometimes works if it's a proxy)
                    try {
                        console.log('Final attempt: direct connection to cluster host...');
                        const finalClient = new MongoClient(`mongodb://${user}:${pass}@${baseHost}/${dbname}?ssl=true&authSource=admin&directConnection=true`, {
                            ...options,
                            serverSelectionTimeoutMS: 5000,
                        });
                        return await finalClient.connect();
                    } catch (finalError) {
                        console.error('All connection attempts failed.');
                        throw finalError;
                    }
                }
            }
        }

        console.error('CRITICAL: MongoDB Connection Failed!');
        console.error('Error Details:', error);
        return null as unknown as MongoClient;
    }
}

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
        globalWithMongo._mongoClientPromise = connectToMongo();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    clientPromise = connectToMongo();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
