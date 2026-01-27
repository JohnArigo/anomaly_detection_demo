export const parseJsonSafely = <T,>(text: string) => {
  try {
    return { ok: true as const, value: JSON.parse(text) as T };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
};
