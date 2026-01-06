import process from 'node:process'

const appBaseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL
const adminApiBase = process.env.NUXT_PUBLIC_ADMIN_API_BASE

export default defineNuxtConfig({
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
  ],

  runtimeConfig: {
    public: {
      appBaseUrl,
      adminApiBase,
      apiBase: '/api-proxy', 
    },
  },

  auth: {
    originEnvKey: 'NUXT_PUBLIC_APP_BASE_URL',
    globalAppMiddleware: true,
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: '/api-proxy/auth/login', method: 'post' },
        signOut: { path: '/api-proxy/auth/logout', method: 'post' },
        getSession: {
          path: '/api-proxy/auth/info',
          method: 'get',
          headers: { Accept: 'application/json' },
        },
      },
      pages: {
        login: '/login',
      },
      token: {
        signInResponseTokenPointer: '/data/access_token',
        type: 'Bearer',
        headerName: 'Authorization',
        maxAgeInSeconds: 31536000,
        sameSiteAttribute: 'lax',
      },
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
    },
  },

  routeRules: {
    '/components': { redirect: '/components/accordion' },
    '/settings': { redirect: '/settings/profile' },
    '/api-proxy/**': {
      proxy: `${adminApiBase}/**`,
    },
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
})
