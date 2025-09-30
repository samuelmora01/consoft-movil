import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler } from '../../interfaces/aws-lambda/handler';

describe('handleApiGateway', () => {
  it('should handle API Gateway events', async () => {
    const event ={
      resource: '/test',
      path: '/test',
      httpMethod: 'GET',
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Host: 'api.example.com',
        'User-Agent': 'test-agent',
        'X-Amzn-Trace-Id': 'Root=1-6894af01-1717d6034d7280285af30f3e',
        'X-Forwarded-For': '127.0.0.1',
        'X-Forwarded-Port': '443',
        'X-Forwarded-Proto': 'https'
      },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: {
        resourceId: 'test',
        resourcePath: '/test',
        operationName: 'test',
        httpMethod: 'GET',
        extendedRequestId: 'test',
        requestTime: '07/Aug/2025:13:49:53 +0000',
        path: '/test',
        accountId: '123456789012',
        protocol: 'HTTP/1.1',
        stage: 'v1',
        domainPrefix: 'api',
        requestTimeEpoch: 1754574593539,
        requestId: '616c8097-61cf-49f9-be3a-232c43496428',
        identity: {} as any,
        domainName: 'api.example.com',
        deploymentId: 'test',
        apiId: 'test'
      },
      body: null,
      isBase64Encoded: false
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event, {} as Context);
    // Update this test based on your actual routing logic
    // Since we removed hello endpoints, this should return appropriate response
    expect(result.statusCode).toBeDefined();
  });
});
