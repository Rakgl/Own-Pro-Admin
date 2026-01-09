import { watch } from 'vue'

export default defineNuxtPlugin(async (nuxtApp) => {
  const api = useApi()
  const i18n = nuxtApp.$i18n

  let auth
  try {
    auth = nuxtApp.$auth || useAuth()
  } catch (e) {
    console.warn('[i18n] Auth not available during plugin initialization')
    auth = null
  }

  const loadedLanguages = new Set<string>()

  async function loadLocaleMessages(locale: string) {
    // Sanitize locale: map en-US to en, and ensure it's supported
    let targetLocale = locale
    if (locale === 'en-US') {
      targetLocale = 'en'
    }

    const supportedLocales = ['en', 'kh']
    if (!supportedLocales.includes(targetLocale)) {
      console.warn(`[i18n] Unsupported locale attempted: ${locale}. Defaulting to 'en'.`)
      targetLocale = 'en'
    }

    if (loadedLanguages.has(targetLocale)) {
      return
    }
    try {
      const messages = await api(`/translations/${targetLocale}`)
      i18n.setLocaleMessage(targetLocale, messages)
      loadedLanguages.add(targetLocale)

      // If we had to sanitize the locale (e.g. en-US -> en), update the i18n locale to match
      if (locale !== targetLocale && i18n.locale.value === locale) {
        i18n.setLocale(targetLocale)
      }
    }
    catch (error) {
      console.error(`[i18n] Failed to load messages for locale: ${targetLocale}`, error)
    }
  }

  async function setUserLanguage() {
    try {
      // Respect user's local preference (cookie) if it exists
      const cookieLocale = useCookie('i18n_redirected')
      const supportedLocales = ['en', 'kh']
      if (cookieLocale.value && cookieLocale.value !== i18n.locale.value && supportedLocales.includes(cookieLocale.value)) {
        const switchLocalePath = useSwitchLocalePath()
        // @ts-ignore: cookieLocale.value is validated by inclusion check but TS might still complain about union type
        const targetPath = switchLocalePath(cookieLocale.value)
        if (targetPath) {
          await navigateTo(targetPath, { external: true })
        }
        return
      }

      if (cookieLocale.value) {
        return
      }

      // Respect the current URL locale if it is already set (and supported)
      // This prevents overriding the language when navigating to a specific localized route
      const currentLocale = i18n.locale.value
      // supportedLocales is already declared above
      if (supportedLocales.includes(currentLocale)) {
        return
      }

      if (!auth) {
        console.warn('[i18n] Auth not available for language setting')
        return
      }

      const authStatus = auth.status?.value || auth.loggedIn?.value
      const authData = auth.data?.value

      if (authStatus === 'authenticated' || (authStatus === true && authData)) {
        const user = authData?.user || authData

        if (user) {
          const userLanguage = user.language || user.locale || user.lang || user.preferred_language

          if (userLanguage) {
            const supportedLocales = ['en', 'kh'] // From nuxt.config.ts
            const targetLocale = supportedLocales.includes(userLanguage) ? userLanguage : 'en'

            if (i18n.locale.value !== targetLocale) {
              console.log(`[i18n] Setting user language to: ${targetLocale}`)
              await loadLocaleMessages(targetLocale)
              await i18n.setLocale(targetLocale)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('[i18n] Failed to set user language:', error)
    }
  }

  await loadLocaleMessages(i18n.locale.value)

  if (import.meta.client) {
    setTimeout(async () => {
      await setUserLanguage()
    }, 500)

    if (auth) {
      try {
        const statusToWatch = auth.status || auth.loggedIn
        if (statusToWatch) {
          watch(statusToWatch, async (newStatus) => {
            if (newStatus === 'authenticated' || newStatus === true) {
              await setUserLanguage()
            }
          })
        }
      } catch (e) {
        console.warn('[i18n] Could not watch auth status:', e)
      }
    }
  }

  watch(i18n.locale, async (newLocale) => {
    await loadLocaleMessages(newLocale)
  })
})
