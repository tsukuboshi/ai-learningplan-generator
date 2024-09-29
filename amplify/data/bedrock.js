export function request(ctx) {
  const prompt = ctx.args.prompt;

  // Extract the model ID from the environment variables
  const model_id = ctx.env.MODEL_ID;

  return {
    resourcePath: `/model/${model_id}/invoke`,
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        anthropic_version: "bedrock-2023-05-31",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `\n\nHuman:${prompt}\n\nAssistant:`,
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      },
    },
  };
}

export function response(ctx) {
  return {
    body: ctx.result.body,
  };
}
