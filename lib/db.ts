// One shared MongoDB Atlas connection for the whole server (API routes, server pages, seed script).
// The connection is cached on globalThis, so hot reloads in development and warm serverless invocations on
// Netlify reuse it instead of opening a new connection on every request.
// MONGODB_URI is read from the server environment only (.env.local locally, Netlify environment variables in
// production). It is never logged, returned in a response, or sent to the browser.
import dns from 'node:dns';
import mongoose from 'mongoose';
import { MissingSecretError } from './errors';

export { MissingSecretError };

/** Some local DNS filters/VPNs (e.g. a resolver on 127.0.0.1) refuse the SRV lookup that "mongodb+srv://" needs. */
function isSrvLookupFailure(error: unknown): boolean {
  const e = error as { message?: string; code?: string; cause?: unknown } | null;
  if (!e) return false;
  if (/querySrv|querytxt/i.test(e.message ?? '') && /ECONNREFUSED|ESERVFAIL|ETIMEOUT|ENOTFOUND|EREFUSED/i.test(`${e.code ?? ''} ${e.message ?? ''}`)) return true;
  return e.cause ? isSrvLookupFailure(e.cause) : false;
}

function connect(uri: string) {
  return mongoose.connect(uri, {
    bufferCommands: false, // fail fast instead of queueing queries while disconnected
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });
}

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as typeof globalThis & { __sgMongoose?: MongooseCache };
const cache: MongooseCache = globalForMongoose.__sgMongoose ?? (globalForMongoose.__sgMongoose = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new MissingSecretError('MONGODB_URI');
  if (!cache.promise) {
    cache.promise = connect(uri)
      .catch((error: unknown) => {
        if (!isSrvLookupFailure(error)) throw error;
        // Retry once through public DNS resolvers (only affects this server process; never needed on Netlify).
        dns.setServers(['1.1.1.1', '8.8.8.8']);
        return connect(uri);
      })
      .catch((error: unknown) => {
        cache.promise = null; // allow a retry on the next request
        throw error;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
