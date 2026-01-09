import moment from 'moment'

export const formatDatetime = (date: string | Date) => moment(date).format('DD/MM/YY, hh:mm A')
export const formatDate = (date: string | Date) => moment(date).format('DD/MM/YY')
export const formatDateRange = (from: string | Date | null, to: string | Date | null) => {
  if (!from && !to) return ''
  const formattedFrom = from ? formatDate(from) : ''
  const formattedTo = to ? formatDate(to) : ''
  return from === to ? formattedFrom : `${formattedFrom} ~ ${formattedTo}`
}
export const dateFormat = (data: string | Date | null) => data ? moment(data).format('DD-MMMM-YYYY') : ''
export const dateTimeFormat = (data: string | Date | null) => data ? moment(data).format('DD-MMMM-YYYY HH:mm A') : ''
