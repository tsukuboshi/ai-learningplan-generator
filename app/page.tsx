"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import {
  Card,
  Heading,
  Flex,
  Label,
  Input,
  SelectField,
  TextAreaField,
} from "@aws-amplify/ui-react";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function App() {
  const [learningPlans, setLearningPlans] = useState<
    Array<Schema["LearningPlan"]["type"]>
  >([]);

  const listLearningPlans = () => {
    client.models.LearningPlan.observeQuery().subscribe({
      next: (data) => setLearningPlans([...data.items]),
    });
  };

  useEffect(() => {
    listLearningPlans();
  }, []);

  const fetchQuestions = async (e: any) => {};

  const generatePlan = async (event: any) => {};

  return (
    <main>
      <div>
        <Card>
          <Heading level={3}>Generate Learning Plans</Heading>
          <Heading level={5}>
            Please fill out the following form to generate a learning plan.
          </Heading>
          <Flex direction="column" gap="small">
            <SelectField
              label="Role"
              options={[
                "Cloud Architect",
                "Software Engineer",
                "Product Designer",
              ]}
            ></SelectField>

            <SelectField
              label="Level"
              options={["Junior", "Mid", "Senior"]}
              onChange={fetchQuestions}
            ></SelectField>
          </Flex>
          <Flex direction="column" margin="large">
            <button onClick={generatePlan}>Submit</button>
          </Flex>
        </Card>
      </div>
      <h1>My LearningPlans</h1>
      <ul>
        {learningPlans.map((learningPlan) => (
          <li key={learningPlan.id}>{learningPlan.role}</li>
        ))}
      </ul>
    </main>
  );
}
