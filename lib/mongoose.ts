import mongoose from "mongoose";

const uri = process.env.DATABASE_URL;

if (!uri) {
  throw new Error("Missing DATABASE_URL environment variable.");
}

const databaseUrl = uri;

export type ConnectionStatus = {
  ok: boolean;
  message: string;
  host: string | null;
};

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const globalCache = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalCache.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalCache.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.conn) {
    return cache.conn;
  }

  cache.promise ??= mongoose.connect(databaseUrl, {
    bufferCommands: false,
  });

  cache.conn = await cache.promise;

  return cache.conn;
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();

    return {
      ok: true,
      message: "Mongoose connection is working.",
      host: new URL(databaseUrl).host,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unknown MongoDB error.",
      host: null,
    };
  }
}
