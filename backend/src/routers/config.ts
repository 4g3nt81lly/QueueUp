import APIRouter from './APIRouter';
import { RouterConfig } from '../types/api';

// FIXME: Most endpoints accept (ignore) extra keys in request body

export default {
	routers: [APIRouter],
} as RouterConfig;
