export class NoReaderError extends Error {
  constructor(operation: string) {
    super(`No reader available to perform ${operation} operation`);
    this.name = "NoReaderError";
  }
}

export class UnsupportedOperationError extends Error {
  constructor(operation: string) {
    super(`Reader does not support ${operation} operation`);
    this.name = "UnsupportedOperationError";
  }
}