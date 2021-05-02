/**
 * TypeScript + promises port of middy http-error-handler
 * https://github.com/middyjs/middy/tree/master/packages/http-error-handler
 */

import type { ShallotAWSMiddlewareWithOptions } from '@shallot/aws';
import type { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

import HttpError from 'http-errors';

export interface TShallotErrorHandlerOptions extends Record<string, unknown> {
  logger?: (...args: unknown[]) => void;
  catchAllErrors?: boolean;
}

/**
 * Shallot middleware that catches "HTTP Errors" thrown by the
 * http-errors npm module and returns the corresponding status
 * code in the response.
 *
 * @param config optional object to pass config options
 */
const ShallotAWSHttpErrorHandler: ShallotAWSMiddlewareWithOptions<
  APIGatewayEvent,
  APIGatewayProxyResult,
  TShallotErrorHandlerOptions
> = (config) => ({
  onError: async (request) => {
    config = { logger: console.error, ...config };

    if (HttpError.isHttpError(request.error)) {
      if (config.logger != null) {
        config.logger(request.error.message);
      }

      request.response = {
        statusCode: request.error.statusCode,
        body: request.error.message,
      };
    } else if (config.catchAllErrors) {
      if (config.logger != null) {
        config.logger(request.error);
      }

      request.response = {
        statusCode: 500,
        body: 'Internal application server error',
      };
    }
  },
});

export default ShallotAWSHttpErrorHandler;
