import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import LoginPage from './LoginPage';

hydrateRoot(
	document.getElementById('root')!,
	<StrictMode>
		<LoginPage />
	</StrictMode>
);
