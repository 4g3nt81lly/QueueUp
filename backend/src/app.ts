import express from 'express';
import { connectMongoDB, disconnectMongoDB } from './database';
import Server from './server';

export default class App {
	private app: express.Application;
	private server: Server;

	public constructor() {
		this.app = express();
		this.server = new Server(this.app);
	}

	public async start() {
		try {
			await connectMongoDB();
			await this.server.start();

			process.on('SIGINT', () => this.stop());
			process.on('SIGTERM', () => this.stop());
		} catch (error) {
			console.error('❌ Fatal error:', error);
			process.exit(1);
		}
	}

	public async stop() {
		try {
			this.server.stop();
			await disconnectMongoDB();
		} finally {
			console.log('🛑 Server stopped!');
			process.exit(0);
		}
	}
}
