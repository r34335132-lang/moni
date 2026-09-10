type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, tag: string, message: string, data?: unknown): void {
  if (__DEV__) {
    const prefix = `[MONI:${tag}]`;
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data ?? '');
        break;
      case 'info':
        console.info(prefix, message, data ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, data ?? '');
        break;
      case 'error':
        console.error(prefix, message, data ?? '');
        break;
    }
  }
}

export const logger = {
  debug: (tag: string, message: string, data?: unknown) => log('debug', tag, message, data),
  info: (tag: string, message: string, data?: unknown) => log('info', tag, message, data),
  warn: (tag: string, message: string, data?: unknown) => log('warn', tag, message, data),
  error: (tag: string, message: string, data?: unknown) => log('error', tag, message, data),
};
