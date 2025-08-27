import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import App from './app';
import { ACCESS_TOKEN_SECRET } from './shared/environment';

if (require.main === module) {
	// Check required environment variables.
	if (!ACCESS_TOKEN_SECRET) {
		console.error('❌ Access token secret not found.');
		process.exit(1);
	}

	const app = new App();
	app.start();
}
