declare module 'fit-file-parser' {
  interface FitParserOptions {
    force?: boolean;
    speedUnit?: 'm/s' | 'km/h' | 'mph';
    lengthUnit?: 'm' | 'km' | 'mi';
    temperatureUnit?: 'celsius' | 'kelvin' | 'fahrenheit';
    pressureUnit?: 'bar' | 'Pa';
    elapsedRecordField?: boolean;
    mode?: 'cascade' | 'list' | 'both';
  }

  interface FitData {
    activity?: Record<string, unknown>;
    sessions?: Record<string, unknown>[];
    laps?: Record<string, unknown>[];
    records?: Record<string, unknown>[];
    devices?: Record<string, unknown>[];
    [key: string]: unknown;
  }

  export default class FitParser {
    constructor(options?: FitParserOptions);
    parse(
      content: ArrayBuffer,
      callback: (error: Error | null, data: FitData) => void
    ): void;
    parseAsync(content: ArrayBuffer): Promise<FitData>;
  }
}
