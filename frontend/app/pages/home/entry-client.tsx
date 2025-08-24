import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import HomePage from './HomePage';

hydrateRoot(
	document.getElementById('root')!,
	<StrictMode>
		<HomePage />
	</StrictMode>
);
