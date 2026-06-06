export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function formatValidationErrors(errors: Record<string, string[]>): string[] {
  const messages: string[] = [];
  for (const field in errors) {
    messages.push(...errors[field].map((msg) => `${field}: ${msg}`));
  }
  return messages;
}
