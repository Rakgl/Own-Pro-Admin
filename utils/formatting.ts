export const cleanObject = (obj: Record<string, any>) => {
  const newObj = { ...obj }
  for (const propName in newObj) {
    if (newObj[propName] === null || newObj[propName] === undefined || newObj[propName] === '') {
      delete newObj[propName]
    }
  }
  return JSON.stringify(newObj)
}

export const objectCheckValue = (obj: Record<string, { value: any }>) => {
  const data = Object.keys(obj).filter(key => obj[key] && obj[key].value !== undefined && obj[key].value !== null && obj[key].value !== '')
  return data.length > 0
}

export const encode = (data: any) => {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))) }
  catch (e) { console.error('Error encoding data:', e); return null }
}

export const decode = (data: string) => {
  try { return JSON.parse(decodeURIComponent(escape(atob(data)))) }
  catch (e) { console.error('Error decoding data:', e); return null }
}
