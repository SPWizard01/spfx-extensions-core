export interface ApiCallResult<T> {
    data: T;
    warnings: string[];
    error: string;
    isError: boolean;
}
