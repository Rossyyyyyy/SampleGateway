export interface UnionbankBaseResponse {
  code: string;
  message: string;
  requestId?: string;
}

export interface UnionbankSuccessResponse<T> extends UnionbankBaseResponse {
  code: 'SUCCESS';
  data: T;
}

export interface UnionbankErrorResponse extends UnionbankBaseResponse {
  errors?: UnionbankApiError[];
}

export interface UnionbankApiError {
  code: string;
  message: string;
  field?: string;
}

export type UnionbankResponse<T> =
  | UnionbankSuccessResponse<T>
  | UnionbankErrorResponse;

export function isUnionbankSuccess<T>(
  response: UnionbankResponse<T>,
): response is UnionbankSuccessResponse<T> {
  return response.code === 'SUCCESS';
}
