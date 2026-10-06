export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleSupabaseError(error: { message: string; code?: string }): never {
  throw new AppError(error.message, error.code ?? 'SUPABASE_ERROR', 500);
}

export function isJwtClockError(error: unknown): boolean {
  const msg =
    error instanceof AppError
      ? error.message
      : error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : '';
  const lower = msg.toLowerCase();
  return (
    lower.includes('jwt issued at future') ||
    lower.includes('issued at future') ||
    lower.includes('token is expired') ||
    lower.includes('invalid jwt') ||
    lower.includes('jwt expired')
  );
}

export function getErrorMessage(error: unknown): string {
  if (isJwtClockError(error)) {
    return 'La hora de tu dispositivo parece incorrecta. Revisa fecha y hora automáticas e inicia sesión de nuevo.';
  }
  if (error instanceof AppError) {
    const msg = error.message.toLowerCase();
    if (msg.includes('could not embed') || msg.includes('relationship')) {
      return 'Error al cargar movimientos. Actualiza la app e intenta de nuevo.';
    }
    if (msg.includes('row-level security') || msg.includes('rls') || msg.includes('violates')) {
      return 'No se pudo completar la acción. Cierra sesión, inicia de nuevo e intenta otra vez.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('could not embed') || msg.includes('relationship')) {
      return 'Error al cargar movimientos. Actualiza la app e intenta de nuevo.';
    }
    if (msg.includes('row-level security') || msg.includes('rls') || msg.includes('violates')) {
      return 'No se pudo completar la acción. Cierra sesión, inicia de nuevo e intenta otra vez.';
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado';
}
