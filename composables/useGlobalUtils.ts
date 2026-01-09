import { useNuxtApp, useRoute, useRouter, useRuntimeConfig } from '#app'
import { computed, onMounted, onUnmounted, ref } from 'vue'

// Import utils
import { dateFormat, formatDate, formatDateRange, formatDatetime, dateTimeFormat } from '@/utils/date'
import { cleanObject, decode, encode, objectCheckValue } from '@/utils/formatting'
import { handleError, hasErrorFor } from '@/utils/validation'
import * as allValidations from '@/utils/validations'

import { useLoadingStore } from '~/stores/loadingStore'
import { useSetupStore } from '~/stores/setupStore'

export function useGlobalUtils() {
  const router = useRouter()
  const route = useRoute()
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()

  const loadingStore = useLoadingStore()
  const setupStore = useSetupStore()
  const { status, data: authData } = nuxtApp.$auth

  const mockI18n = {
    locale: ref(nuxtApp.$i18n?.locale?.value || 'en'),
    t: (key: string) => nuxtApp.$i18n?.t ? nuxtApp.$i18n.t(key) : `Translated: ${key}`,
  }

  const input_option = {
    outlined: true,
    dense: true,
    hideDetails: 'auto' as const,
    clearable: false,
    clearIcon: 'mdi-close-circle-outline',
  }

  const table_item_per_page = [15, 50, 100, 200]

  const copy_right = computed(() => `&copy; ${new Date().getFullYear()} — Made with ❤️ by <a href="https://www.aditi.com.kh/en" target="_blank" rel="noopener noreferrer">ADITI</a>`)

  const status_options = [
    { value: 'ACTIVE', text: 'Active' },
    { value: 'INACTIVE', text: 'Inactive' },
  ]

  const is_scroll = ref(false)
  const validations = allValidations

  const isDataLoading = computed(() => loadingStore.isDataLoading)
  const isTableLoading = computed(() => loadingStore.isTableLoading)

  const loggedIn = computed(() => status.value === 'authenticated')
  const currentUser = computed(() => authData.value?.user || null)
  const userPermissions = computed(() => authData.value?.permissions || [])

  // API Calls using runtimeConfig for base URL
  const adminApiBase = config.public.apiBase

  const getDataTableData = async (
    endpointUrl: string,
    search: string | null,
    filter: Record<string, any> | null,
    options: { sortBy: string[], sortDesc: boolean[], page: number, itemsPerPage: number },
  ) => {
    const { sortBy, sortDesc, page, itemsPerPage } = options
    const controller = new AbortController()
    const signal = controller.signal

    const queryParams: Record<string, string | number | boolean | undefined> = {
      page: (search ? 1 : page),
      per_page: itemsPerPage,
      search: search || undefined,
    }

    if (filter) {
      queryParams.filter = JSON.stringify(filter)
    }

    if (sortBy.length > 0 && sortBy[0]) {
      queryParams.sortBy = sortBy[0]
      if (sortDesc.length > 0) {
        queryParams.sortDesc = sortDesc[0]
      }
    }

    const newQueryForRoute = {
      page: page.toString(),
      length: itemsPerPage.toString(),
      ...(filter ? { filter: JSON.stringify(filter) } : {}),
    }
    if (JSON.stringify(route.query) !== JSON.stringify(newQueryForRoute)) {
      try {
        await router.push({ query: newQueryForRoute })
      }
      catch (e) {
        console.warn('Navigation error in getDataTableData:', e)
      }
    }

    try {
      const fullUrl = `${adminApiBase}/${endpointUrl.startsWith('/') ? endpointUrl.substring(1) : endpointUrl}`
      const response: any = await $fetch(fullUrl, {
        params: queryParams,
        signal,
        headers: {
          Accept: 'application/json',
        },
      })

      if (response) {
        let items = response.data || []
        const total = response.meta?.total || response.total || 0
        const totalSum = response.total_sum || []

        if (sortBy.length === 1 && sortDesc.length === 1 && items.length > 0 && !queryParams.sortBy) {
          items = [...items].sort((a, b) => {
            const sortA = a[sortBy[0]]
            const sortB = b[sortBy[0]]
            if (sortDesc[0]) {
              if (sortA < sortB) return 1
              if (sortA > sortB) return -1
              return 0
            }
            else {
              if (sortA < sortB) return -1
              if (sortA > sortB) return 1
              return 0
            }
          })
        }
        return { items, total, totalSum, cancel: () => controller.abort() }
      }
    }
    catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted')
      }
      else {
        console.error('Error fetching data table:', error)
      }
      return { items: [], total: 0, totalSum: [], cancel: () => controller.abort() }
    }
    return { items: [], total: 0, totalSum: [], cancel: () => controller.abort() }
  }

  const permission = (permissionName: string) => {
    console.log('Checking permission:', permissionName)
    if (!loggedIn.value || !currentUser.value)
      return false

    if (userPermissions.value && Array.isArray(userPermissions.value)) {
      return userPermissions.value.some((p: any) => typeof p === 'string' ? p === permissionName : p.permission_slug === permissionName)
    }

    if (permissionName === 'for_developer') {
      return isDeveloper()
    }
    return false
  }

  const isSuperAdmin = () => {
    if (!loggedIn.value || !currentUser.value)
      return false
    return currentUser.value?.role === 'Super Admin'
  }

  const isDeveloper = () => {
    if (!loggedIn.value || !currentUser.value)
      return false
    return currentUser.value?.role === 'Developer'
  }

  const isAdmin = () => {
    if (!loggedIn.value || !currentUser.value)
      return false
    return currentUser.value?.role === 'Admin'
  }

  const generalInfo = (name: string) => {
    return setupStore.generalInfo ? setupStore.generalInfo[name] : undefined
  }

  const exportFile = async (
    endpointUrl: string,
    dataFilter: Record<string, any> | null,
    search: string | null,
    fileName: string,
    type: 'excel' | 'pdf',
  ) => {
    const extension = type === 'excel' ? 'xlsx' : 'pdf'
    const queryParams: Record<string, string> = {}

    if (dataFilter) {
      Object.keys(dataFilter).forEach((key) => {
        if (dataFilter[key] !== null && dataFilter[key] !== undefined) {
          queryParams[key] = String(dataFilter[key])
        }
      })
    }
    if (search) {
      queryParams.search = search
    }

    try {
      const fullUrl = `${adminApiBase}/${endpointUrl.startsWith('/') ? endpointUrl.substring(1) : endpointUrl}/export/${type}`
      const blob: Blob = await $fetch(fullUrl, {
        params: queryParams,
        responseType: 'blob',
        headers: {
          Accept: type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
        },
      })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.setAttribute('download', `${fileName || endpointUrl}.${extension}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(link.href)
    }
    catch (error) {
      console.error(`Error exporting ${type}:`, error)
    }
  }

  const exportExcel = (endpointUrl: string, dataFilter: Record<string, any> | null, search: string | null, fileName: string) => {
    exportFile(endpointUrl, dataFilter, search, fileName, 'excel')
  }

  const downloadPdf = (endpointUrl: string, dataFilter: Record<string, any> | null, fileName = 'report') => {
    exportFile(endpointUrl, dataFilter, null, fileName, 'pdf')
  }

  const translate = (data: Record<string, string> | null) => {
    if (!data)
      return null
    const currentLocale = mockI18n.locale.value
    if (data[currentLocale]) {
      return data[currentLocale]
    }
    return Object.values(data)[0] || null
  }

  const goBack = () => router.back()

  const handleScroll = () => {
    if (typeof window !== 'undefined') {
      is_scroll.value = window.scrollY > 0
    }
  }

  if (import.meta.client) {
    onMounted(() => window.addEventListener('scroll', handleScroll))
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  }

  return {
    input_option,
    table_item_per_page,
    copy_right,
    status_options,
    is_scroll,
    validations,
    isDataLoading,
    isTableLoading,
    loggedIn,
    currentUser,
    userPermissions,
    formatDatetime,
    formatDate,
    formatDateRange,
    dateFormat,
    dateTimeFormat,
    getDataTableData,
    permission,
    isSuperAdmin,
    isDeveloper,
    isAdmin,
    generalInfo,
    exportExcel,
    downloadPdf,
    translate,
    hasErrorFor,
    handleError,
    encode,
    decode,
    goBack,
    cleanObject,
    objectCheckValue,
  }
}

