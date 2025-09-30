import { Context } from 'aws-lambda';
import { handler } from '../../interfaces/aws-lambda/handler';

describe('handler (EventBridge)', () => {
  it('should handle an EventBridge event', async () => {
    const event = {
      source: 'EVENT_BRIDGE',
      detail: { operationName: 'test-event', data: { message: 'test' } }
    };
    const result = await handler(event, {} as Context);
    // Update this test based on your actual event routing logic
    expect(result.statusCode).toBeDefined();
  });
});
