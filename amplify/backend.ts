import { defineBackend } from "@aws-amplify/backend";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { auth } from "./auth/resource.js";
import { data } from "./data/resource.js";

const backend = defineBackend({
  auth,
  data,
});

export const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
export const MODEL_REGION = "ap-northeast-1";

const bedrockDataSource = backend.data.resources.graphqlApi.addHttpDataSource(
  "bedrockDS",
  `https://bedrock-runtime.${MODEL_REGION}.amazonaws.com`,
  {
    authorizationConfig: {
      signingRegion: MODEL_REGION,
      signingServiceName: "bedrock",
    },
  }
);

bedrockDataSource.grantPrincipal.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    resources: ["arn:aws:bedrock:*::foundation-model/*"],
    actions: ["bedrock:InvokeModel"],
  })
);

// Add environment variables to the GraphQL API
backend.data.resources.cfnResources.cfnGraphqlApi.environmentVariables = {
  MODEL_ID,
};
