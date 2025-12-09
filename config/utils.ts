export function getenv(name: string, defaultValue?: string): string {
    const value = process.env[name];
    if (value === undefined || value === "") {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable "${name}" is not set`);
    }
    return value;
}
