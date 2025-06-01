// nuxt.config.ts - Updated configuration
const appBaseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';
const adminApiBase = process.env.NUXT_PUBLIC_ADMIN_API_BASE || 'http://localhost:8000/api/v1/admin';

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@unocss/nuxt',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@sidebase/nuxt-auth',
  ],

  // Expose base URLs to your app if needed elsewhere
  runtimeConfig: {
    public: {
      appBaseUrl: appBaseUrl,
      adminApiBase: adminApiBase,
    },
  },

  auth: {
    originEnvKey: 'appBaseUrl',
    globalAppMiddleware: true,
    // origin: appBaseUrl,
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: `${adminApiBase}/auth/login`, method: 'post' },
        signOut: { path: `${adminApiBase}/auth/logout`, method: 'post' },
        signUp: false,
        getSession: {
          path: `${adminApiBase}/auth/info`,
          method: 'get',
          headers: {
            Accept: 'application/json',
          },
        },
      },
      pages: {
        login: '/login',
      },
      token: {
        signInResponseTokenPointer: '/data/access_token',
        type: 'Bearer',
        headerName: 'Authorization',
        maxAgeInSeconds: 365 * 24 * 60 * 60,
        sameSiteAttribute: 'lax',
      },
      // Updated session data type to include permissions
      sessionDataType: {
        user: {
          id: 'string',
          name: 'string',
          username: 'string',
          email: 'string',
          role: 'string',
          status: 'object',
          created_at: 'string',
          updated_at: 'string',
        },
        permissions: 'array',
      },
      refresh: {
        isEnabled: false,
        endpoint: {
          path: `${adminApiBase}/auth/refresh-token`,
          method: 'post',
          headers: {
            Accept: 'application/json',
          },
        },
        token: {
          signInResponseRefreshTokenPointer: '/data/refresh_token',
          refreshResponseTokenPointer: '/data/access_token',
          refreshResponseRefreshTokenPointer: '/data/refresh_token',
          refreshRequestTokenPointer: '/refresh_token',
          maxAgeInSeconds: 365 * 24 * 60 * 60,
          sameSiteAttribute: 'lax',
        },
      },
    },
  },

  css: ['@unocss/reset/tailwind.css'],

  colorMode: {
    classSuffix: '',
  },

  features: {
    inlineStyles: false,
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  routeRules: {
    '/components': { redirect: '/components/accordion' },
    '/settings': { redirect: '/settings/profile' },
    // Permission-protected routes
    '/admin/**': { middleware: 'permission' },
    '/customers/**': { middleware: 'permission' },
    '/stations/**': { middleware: 'permission' },
    '/users/**': { middleware: 'admin' }, // Only admin can access user management
    '/roles/**': { middleware: 'admin' },
    '/reports/**': { middleware: 'permission' },
  },

  imports: {
    dirs: [
      './lib',
      './stores', // Auto-import stores
      './composables', // Auto-import composables
    ],
  },

  compatibilityDate: '2024-12-14',
});
