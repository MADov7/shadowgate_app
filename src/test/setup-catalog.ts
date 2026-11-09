// Vitest setup: the runtime catalog registry is empty until products arrive from MongoDB, so unit tests register
// the seed catalog (scripts/seed/catalog-data.ts) before each test file.
import { registerServices } from '../data/services';
import { SEED_SERVICES } from '../../scripts/seed/catalog-data';

registerServices(SEED_SERVICES);
