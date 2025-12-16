// src/utils/response-formatting.utils.ts

export interface ResponseFormat {
    statusCode: number;
    message: string;
    data?: any;
    error?: string | string[] | null;
}

export function formatResponse({
    statusCode,
    message,
    data = null,
    error = null,
}: ResponseFormat): object {
    return {
        statusCode,
        message,
        data,
        error,
    };
}
