import type {
  Context,
  Handler,
  APIGatewayEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';

import { test, describe, jest, expect } from '@jest/globals';

import HttpError from 'http-errors';
import ShallotAWS from '@shallot/aws';
import { ShallotAWSHttpErrorHandler } from '../src';

describe('http-error-handler middleware', () => {
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: '',
    functionVersion: '',
    invokedFunctionArn: '',
    memoryLimitInMB: '',
    awsRequestId: '',
    logGroupName: '',
    logStreamName: '',
    getRemainingTimeInMillis: () => 0,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
  };

  const mockHandlerWithHTTPError: Handler<
    APIGatewayEvent,
    APIGatewayProxyResult
  > = async () => {
    throw HttpError(400, 'Test error message');
  };

  test('Skips normal errors', async () => {
    const mockHandlerWithError: Handler<
      APIGatewayEvent,
      APIGatewayProxyResult
    > = async () => {
      throw new Error('Test error');
    };

    const wrappedHandler = ShallotAWS(mockHandlerWithError).use(
      ShallotAWSHttpErrorHandler()
    );

    const res = await wrappedHandler(
      (undefined as unknown) as APIGatewayEvent,
      mockContext,
      jest.fn()
    );
    expect(res).not.toBeDefined();
  });

  test('Triggers from HTTPError', async () => {
    const wrappedHandler = ShallotAWS(mockHandlerWithHTTPError).use(
      ShallotAWSHttpErrorHandler({ logger: undefined })
    );

    const res = await wrappedHandler(
      (undefined as unknown) as APIGatewayEvent,
      mockContext,
      jest.fn()
    );
    expect(res.statusCode).toBe(400);
  });

  test('Custom logger', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const logger = jest.fn(() => {});
    const wrappedHandler = ShallotAWS(mockHandlerWithHTTPError).use(
      ShallotAWSHttpErrorHandler({ logger })
    );

    await wrappedHandler(
      (undefined as unknown) as APIGatewayEvent,
      mockContext,
      jest.fn()
    );
    expect(logger).toHaveBeenCalledTimes(1);
  });
});
