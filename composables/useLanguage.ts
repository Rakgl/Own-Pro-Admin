/**
 * Composable for managing user language preferences
 */
export const useLanguage = () => {
  const { $auth } = useNuxtApp()
  const { setLocale, locale, setLocaleMessage, messages } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const api = useApi()

  /**
   * Get the current user's language preference
   */
  const getCurrentUserLanguage = () => {
    try {
      if (!$auth) return 'en'

      const authStatus = $auth.status?.value || $auth.loggedIn?.value
      const authData = $auth.data?.value

      if ((authStatus === 'authenticated' || authStatus === true) && authData) {
        const user = authData.user || authData
        if (user) {
          return user.language || user.locale || user.lang || user.preferred_language || 'en'
        }
      }
    } catch (error) {
      console.warn('[Language] Error getting current user language:', error)
    }
    return 'en'
  }

  /**
   * Update user's language preference in the backend
   */
  const updateUserLanguage = async (language: string) => {
    try {
      if (!$auth) {
        console.warn('[Language] Auth not available for language update')
        return
      }

      const authStatus = $auth.status?.value || $auth.loggedIn?.value
      const authData = $auth.data?.value

      if (authStatus === 'authenticated' || (authStatus === true && authData)) {
        // Update user language preference via API
        await api('/user/language', {
          method: 'PUT',
          body: { language }
        })

        // Update local auth data if needed
        const user = authData?.user || authData
        if (user) {
          user.language = language
        }

        console.log(`[Language] User language preference updated to: ${language}`)
      }
    } catch (error) {
      console.error('[Language] Failed to update user language preference (non-fatal):', error)
      // We don't throw here to allow the client-side language switch to proceed
      // even if the backend update fails.
    }
  }

  /**
   * Change language and optionally save to user preferences
   */
  const setLanguage = async (language: string, saveToProfile = true) => {
    try {
      const supportedLocales = ['en', 'kh']

      if (!supportedLocales.includes(language)) {
        console.warn(`[Language] Unsupported language: ${language}, defaulting to 'en'`)
        language = 'en'
      }

      console.log(`[Language] Attempting to set language to: ${language}`)

      // Pre-load messages if they are missing
      // This ensures the UI has strings ready before the locale switches
      const currentMessages = messages.value[language]
      if (!currentMessages || Object.keys(currentMessages).length === 0) {
        console.log(`[Language] Fetching messages for ${language} before switching...`)
        try {
          const response = await api(`/translations/${language}`)
          const newMessages = response.data || response
          setLocaleMessage(language, newMessages)
        } catch (fetchError) {
          console.error(`[Language] Failed to fetch translations for ${language}`, fetchError)
          // We continue to try to switch, hoping maybe partial data or fallback helps
        }
      }

      // 1. Update Backend FIRST (before any navigation/reload)
      // We attempt to save to profile, but if it fails, we still proceed with local switch.
      if (saveToProfile && $auth) {
        const authStatus = $auth.status?.value || $auth.loggedIn?.value
        if (authStatus === 'authenticated' || authStatus === true) {
          await updateUserLanguage(language)
        }
      }

      // 2. Update internal locale state
      await setLocale(language)

      // 3. FORCE Update Cookie (The "Hard" Fix)
      // We explicitly set the cookie to ensure persistence, bypassing potential module conflicts
      const cookie = useCookie('i18n_redirected', { maxAge: 365 * 24 * 60 * 60, path: '/' })
      cookie.value = language


      // 4. Navigation to Localized Path
      const path = switchLocalePath(language)
      console.log(`[Language] Switching to path: ${path}`)

      if (path && typeof path === 'string') {
        await navigateTo(path)
      } else {
        console.warn('[Language] switchLocalePath returned invalid path:', path)
      }

      console.log(`[Language] Language change flow completed for: ${language}`)
    } catch (error) {
      console.error('[Language] Failed to set language:', error)
      throw error
    }
  }

  /**
   * Get available languages
   */
  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'kh', name: 'Khmer', nativeName: 'ខ្មែរ' },
    ]
  }

  /**
   * Get current language info
   */
  const getCurrentLanguage = () => {
    const currentCode = locale.value
    const availableLanguages = getAvailableLanguages()
    return availableLanguages.find(lang => lang.code === currentCode) || availableLanguages[0]
  }

  return {
    getCurrentUserLanguage,
    updateUserLanguage,
    setLanguage,
    getAvailableLanguages,
    getCurrentLanguage,
  }
}