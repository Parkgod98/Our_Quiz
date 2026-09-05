type ErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
};

export function logServerError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const value = error as ErrorLike | null | undefined;
  console.error("[our-quiz:error]", {
    context,
    message: value?.message ?? String(error),
    code: value?.code,
    details: value?.details,
    hint: value?.hint,
    stack: value?.stack,
    ...extra,
  });
}
