import { LazyRouterConfig } from '../utils/lazyRouter.ts';

/**
 * Register all routers here. Each entry maps a URL path to a router module.
 *
 * To add a new route:
 * 1. Create your router at `src/routes/<name>/index.ts`
 * 2. Export it as a named export, e.g. `export { router as myRouter }`
 * 3. Add an entry to ROUTER_CONFIG below
 * 4. Add the matching case to `getStaticRouter` in `utils/lazyRouter.ts`
 */
export const ROUTER_CONFIG: LazyRouterConfig[] = [
  {
    path: '/api/example',
    key: 'example',
    importPath: '../routes/example/index.ts',
    exportName: 'exampleRouter',
  },
  {
    path: '/api/users',
    key: 'users',
    importPath: '../routes/users/index.ts',
    exportName: 'usersRouter',
  },
  {
    path: '/api/matches',
    key: 'matches',
    importPath: '../routes/matches/index.ts',
    exportName: 'matchesRouter',
  },
  {
    path: '/api/messages',
    key: 'messages',
    importPath: '../routes/messages/index.ts',
    exportName: 'messagesRouter',
  },
  {
    path: '/api/discovery',
    key: 'discovery',
    importPath: '../routes/discovery/index.ts',
    exportName: 'discoveryRouter',
  },
  {
    path: '/api/likes',
    key: 'likes',
    importPath: '../routes/likes/index.ts',
    exportName: 'likesRouter',
  },
];

export function validateRouterConfig(config: LazyRouterConfig[]): void {
  const seenPaths = new Set<string>();
  const seenKeys = new Set<string>();

  for (const router of config) {
    if (seenPaths.has(router.path)) {
      throw new Error(`Duplicate router path: ${router.path}`);
    }
    seenPaths.add(router.path);

    if (seenKeys.has(router.key)) {
      throw new Error(`Duplicate router key: ${router.key}`);
    }
    seenKeys.add(router.key);

    if (!router.path || !router.key || !router.importPath || !router.exportName) {
      throw new Error(`Invalid router configuration: ${JSON.stringify(router)}`);
    }

    if (!router.path.startsWith('/api/')) {
      console.warn(`Router path should start with /api/: ${router.path}`);
    }
  }
}
