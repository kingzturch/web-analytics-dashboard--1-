export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  requestId?: string;
  siteId?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private static format(level: LogLevel, component: string, message: string, metadata?: Record<string, any>, requestId?: string, siteId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      requestId,
      siteId,
      metadata
    };
  }

  public static info(component: string, message: string, metadata?: Record<string, any>, requestId?: string, siteId?: string) {
    const log = this.format('INFO', component, message, metadata, requestId, siteId);
    console.log(JSON.stringify(log));
  }

  public static warn(component: string, message: string, metadata?: Record<string, any>, requestId?: string, siteId?: string) {
    const log = this.format('WARN', component, message, metadata, requestId, siteId);
    console.warn(JSON.stringify(log));
  }

  public static error(component: string, message: string, metadata?: Record<string, any>, requestId?: string, siteId?: string) {
    const log = this.format('ERROR', component, message, metadata, requestId, siteId);
    console.error(JSON.stringify(log));
  }

  public static fatal(component: string, message: string, metadata?: Record<string, any>, requestId?: string, siteId?: string) {
    const log = this.format('FATAL', component, message, metadata, requestId, siteId);
    console.error(JSON.stringify(log));
  }
}
