import mongoose from 'mongoose';
import { MONGODB_URI } from './shared/environment';

// Make mongoose schema validator acknowledge empty string for required fields
mongoose.Schema.Types.String.checkRequired((value) => typeof value === 'string');

export async function connectMongoDB() {
	if (!MONGODB_URI) {
		throw new Error('Missing MONGODB_URI environment variable');
	}
	await mongoose.connect(MONGODB_URI);
	console.log('✅ MongoDB connected');
}

export async function disconnectMongoDB() {
	await mongoose.disconnect();
	console.log('💥 MongoDB disconnected');
}
