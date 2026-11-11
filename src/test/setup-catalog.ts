// Vitest setup: the runtime catalog registry is empty until products arrive from Supabase, so unit tests register
// the seed catalog (src/test/fixtures/catalog.fixture.ts) before each test file.
import { registerServices } from '../data/services';
import { SEED_SERVICES } from './fixtures/catalog.fixture';

registerServices(SEED_SERVICES);
