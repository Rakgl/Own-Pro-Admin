export const hasErrorFor = (field: string, errorMessages: Record<string, string[]>) => {
  return field ? !!errorMessages[field] : false
}

export const handleError = (field: string, errorMessages: Record<string, string[]>) => {
  if (hasErrorFor(field, errorMessages))
    return errorMessages[field][0]
  return undefined
}
