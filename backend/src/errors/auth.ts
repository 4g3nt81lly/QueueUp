import { APIError } from './rest';

export class UserAuthorizationError extends APIError {};

export class CredentialValidationError extends UserAuthorizationError {};
