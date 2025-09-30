import { handler } from "../../interfaces/aws-lambda/handler";
import { Context } from "aws-lambda";

describe("handleSQS", () => {
  it("should handle an SQS event", async () => {
    const sqsEvent = {
      Records: [
        {
          messageId: "1",
          receiptHandle: "abc",
          body: JSON.stringify({ operationName: "test-operation", data: { message: "test" } }),
          attributes: {},
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:TestQueue",
          awsRegion: "us-east-1"
        }
      ]
    } as any; // You can use 'as SQSEvent' if you have the type imported

    const result = await handler(sqsEvent, {} as Context);
    // Update this test based on your actual queue routing logic
    expect(result.statusCode).toBeDefined();
  });
});