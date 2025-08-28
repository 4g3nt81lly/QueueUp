import { APIError } from './rest';

export class UserCredentialError extends APIError {}

export class CredentialValidationError extends UserCredentialError {}
