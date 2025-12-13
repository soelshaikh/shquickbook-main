const THRESHOLD = 20; // ms
const isDev = import.meta.env.DEV;

type LogLevel = 'fast' | 'medium' | 'slow';

const getLogLevel = (duration: number): LogLevel => {
  if (duration < THRESHOLD) return 'fast';
  if (duration <= 100) return 'medium';
  return 'slow';
};

const getLogStyle = (level: LogLevel): string => {
  switch (level) {
    case 'fast': return 'color: #10b981; font-weight: bold';
    case 'medium': return 'color: #f59e0b; font-weight: bold';
    case 'slow': return 'color: #ef4444; font-weight: bold';
  }
};

const getLogIcon = (level: LogLevel): string => {
  switch (level) {
    case 'fast': return '✅';
    case 'medium': return '⚠️';
    case 'slow': return '🔴';
  }
};

export const logPageLoad = (pageName: string, startTime: number): void => {
  if (!isDev) return;
  
  const duration = performance.now() - startTime;
  const level = getLogLevel(duration);
  const icon = getLogIcon(level);
  
  console.log(
    `%c${icon} Page Load: ${pageName} - ${duration.toFixed(2)}ms`,
    getLogStyle(level)
  );
};

export const logInteraction = (actionName: string, duration: number): void => {
  if (!isDev) return;
  
  const level = getLogLevel(duration);
  const icon = getLogIcon(level);
  
  console.log(
    `%c${icon} Interaction: ${actionName} - ${duration.toFixed(2)}ms`,
    getLogStyle(level)
  );
};

export const logApiCall = (endpoint: string, duration: number): void => {
  if (!isDev) return;
  
  const level = getLogLevel(duration);
  const icon = getLogIcon(level);
  
  console.log(
    `%c${icon} API Call: ${endpoint} - ${duration.toFixed(2)}ms`,
    getLogStyle(level)
  );
};

export const measureAsync = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  if (!isDev) return fn();
  
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logApiCall(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.log(
      `%c🔴 API Error: ${name} - ${duration.toFixed(2)}ms`,
      'color: #ef4444; font-weight: bold'
    );
    throw error;
  }
};
