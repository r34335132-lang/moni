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

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    const msg = error.message.toLowerCase();
    if (msg.includes('could not embed') || msg.includes('relationship')) {
      return 'Error al cargar movimientos. Actualiza la app e intenta de nuevo.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('could not embed') || msg.includes('relationship')) {
      return 'Error al cargar movimientos. Actualiza la app e intenta de nuevo.';
    }
    return error.message;
  }
  return 'Ocurrió un error inesperado';
}
