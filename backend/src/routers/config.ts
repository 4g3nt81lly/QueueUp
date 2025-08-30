import { RouterConfig } from '../types/api';
import APIRouter from './api/v1/config';

// FIXME: Most endpoints accept (ignore) extra keys in request body

export default {
	routers: [APIRouter],
} as RouterConfig;
