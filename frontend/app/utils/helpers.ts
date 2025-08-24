/* Miscellaneous */

export function debugLog(message?: any, ...args: any[]) {
	if (import.meta.env.DEV) {
		console.debug('[Debug]', ...[message, ...args]);
	}
}

export function isPresent(data: any) {
	return data !== undefined && data !== null;
}

/* API */

const ACCESS_TOKEN_KEY = 'accessToken';

export function setAccessToken(accessToken: string) {
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function getAccessToken() {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}
