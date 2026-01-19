import process from 'node:process'

const appBaseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL
const adminApiBase = process.env.NUXT_PUBLIC_ADMIN_API_BASE

export default defineNuxtConfig({
  devtools: {
    enabled: true,
    vscode: {},
  },
  ssr: false,

  compatibilityDate: '2024-12-14',

  build: {
    transpile: ['@tanstack/vue-table'],
  },

  modules: [
    '@unocss/nuxt',
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@sidebase/nuxt-auth',
    '@nuxtjs/i18n',
  ],

  runtimeConfig: {
    public: {
      appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL,
      adminApiBase: process.env.NUXT_PUBLIC_ADMIN_API_BASE,
      apiBase: '/api/v1/admin',
    },
  },

  auth: {
    baseURL: '/api/v1/admin/auth',
    globalAppMiddleware: true,
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: `/login`, method: 'post' },
        signOut: { path: `/logout`, method: 'post' },
        signUp: false,
        getSession: { path: `/info`, method: 'get' },
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
      refresh: {
        isEnabled: false,
        endpoint: { path: `/refresh-token`, method: 'post' },
        token: {
          signInResponseRefreshTokenPointer: '/data/refresh_token',
          refreshResponseTokenPointer: '/data/access_token',
          refreshRequestTokenPointer: '/refresh_token',
          maxAgeInSeconds: 365 * 24 * 60 * 60,
          sameSiteAttribute: 'lax',
        },
      },
    },
  },

  vite: process.env.PROXY_API_URL
    ? {
      server: {
        proxy: {
          '/api/v1/admin': {
            target: process.env.PROXY_API_URL,
            changeOrigin: true,
            secure: false,
            configure: (proxy, _options) => {
              console.log('🚀 Proxy configured for /api/v1/admin →', process.env.PROXY_API_URL);
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('📤 Proxying:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('📥 Response:', proxyRes.statusCode, req.url);
              });
            },
          },
        },
      },
    }
    : {},

  routeRules: {
    // '/**': { headers: { 'Cache-Control': 'no-cache' } },
    '/': { redirect: '/dashboard' },
    '/components': { redirect: '/components/accordion' },
    '/settings': { redirect: '/settings/profile' },
    '/admin/**': { appMiddleware: 'permission' },
    '/customers/**': { appMiddleware: 'permission' },
    '/stations/**': { appMiddleware: 'permission' },
    '/users/**': { appMiddleware: 'admin' },
    '/roles/**': { appMiddleware: 'admin' },
    '/reports/**': { appMiddleware: 'permission' },
  },

  css: ['@unocss/reset/tailwind.css'],
  colorMode: { classSuffix: '' },
  features: { inlineStyles: false },

  imports: {
    dirs: ['./lib', './stores', './composables'],
  },
  i18n: {
    lazy: true,
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    vueI18n: './i18n.config.ts',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    locales: [
      { code: 'en', name: 'English' },
      { code: 'kh', name: 'Khmer' },
    ],
  },
})