import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Use @Public() on controller methods or controllers to allow unauthenticated access.
 * By default routes are protected (fail-closed) when the global JwtAuthGuard is enabled.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
