export const PRODUCTION = process.env.NODE_ENV === 'production';
export const DEVELOPMENT = process.env.NODE_ENV === 'development';

export const PORT = process.env.PORT ?? 4000;

export const MONGODB_URI = process.env.MONGODB_URI;
export const FRONTEND_ORIGIN =
	process.env.FRONTEND_ORIGIN ??
	(PRODUCTION ? 'http://localhost:3000' : 'http://localhost:5173');
