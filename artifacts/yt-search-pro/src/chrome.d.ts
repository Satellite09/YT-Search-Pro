declare namespace chrome {
  namespace runtime {
    const id: string | undefined;
    function sendMessage(message: unknown): Promise<any>;
    const lastError: { message?: string } | undefined;
  }
}