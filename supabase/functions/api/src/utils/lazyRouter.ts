// @deno-types="npm:@types/express@^4.17"
import { Request, Response, NextFunction } from 'npm:express@4.18.2';

export interface LazyRouterConfig {
  /** The base URL path for this router (e.g., '/api/user') */
  path: string;
  /** Unique identifier used for caching and logging */
  key: string;
  /** Import path relative to src/ */
  importPath: string;
  /** Named export from the module */
  exportName: string;
}

const routerCache = new Map<string, unknown>();

/**
 * Static import fallback — required because dynamic imports can be unreliable
 * in some edge environments. Add a case here whenever you add a new router.
 */
async function getStaticRouter(config: LazyRouterConfig): Promise<unknown> {
  switch (config.key) {
    case 'example': {
      const { exampleRouter } = await import('../routes/example/index.ts');
      return exampleRouter;
    }
    case 'users': {
      const { usersRouter } = await import('../routes/users/index.ts');
      return usersRouter;
    }
    case 'matches': {
      const { matchesRouter } = await import('../routes/matches/index.ts');
      return matchesRouter;
    }
    case 'messages': {
      const { messagesRouter } = await import('../routes/messages/index.ts');
      return messagesRouter;
    }
    case 'discovery': {
      const { discoveryRouter } = await import('../routes/discovery/index.ts');
      return discoveryRouter;
    }
    case 'likes': {
      const { likesRouter } = await import('../routes/likes/index.ts');
      return likesRouter;
    }
    default:
      throw new Error(
        `Unknown router key: "${config.key}". Add it to getStaticRouter in utils/lazyRouter.ts.`,
      );
  }
}

/**
 * Returns an Express middleware that lazy-loads the router on first request
 * then serves from cache on subsequent requests.
 */
export function createLazyRouter(config: LazyRouterConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!routerCache.has(config.key)) {
        console.log(`Lazy loading router: ${config.key}`);

        let router: unknown;
        try {
          const mod = await import(config.importPath);
          router = mod[config.exportName];
          if (!router) {
            throw new Error(`Export "${config.exportName}" not found in ${config.importPath}`);
          }
        } catch {
          console.warn(`Dynamic import failed for "${config.key}", falling back to static import`);
          router = await getStaticRouter(config);
        }

        routerCache.set(config.key, router);
      }

      (routerCache.get(config.key) as (req: Request, res: Response, next: NextFunction) => void)(
        req,
        res,
        next,
      );
    } catch (error) {
      console.error(`Error in lazy router "${config.key}":`, error);
      next(error);
    }
  };
}

export function getRouterStats() {
  return {
    loadedRouters: Array.from(routerCache.keys()),
    cacheSize: routerCache.size,
  };
}
