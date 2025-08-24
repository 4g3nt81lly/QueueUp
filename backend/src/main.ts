import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import App from './app';

if (require.main === module) {
	const app = new App();
	app.start();
}
