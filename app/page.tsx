"use client";
import { Authenticator } from '@aws-amplify/ui-react';
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
  Loader
} from "@aws-amplify/ui-react";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function App() {
  type Question = {
    id: number;
    text: string;
  };

  type Answers = {
    [key: number]: string;
  };
  const [answers, setAnswers] = useState<Answers>({});
  const noOfQuestions = 6; //no of questions the llm should return
  const [role, setRole] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [questions, setQuestions] = useState<Array<Question>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [learningPlans, setLearningPlans] = useState<
    Array<Schema["LearningPlan"]["type"]>
  >([]);
  const sampleQuestions = {
    questions: [
      {
        id: 1,
        text: "What is your current level of expertise?",
      },
      {
        id: 2,
        text: "How comfortable are you with presenting to an audience?",
      },
    ],
  };

  const listLearningPlans = () => {
    client.models.LearningPlan.observeQuery().subscribe({
      next: (data) => setLearningPlans([...data.items]),
    });
  };

  useEffect(() => {
    listLearningPlans();
  }, []);

  const handleRoleChange = (role: string) => {
    setRole(role)
  }

  const handleInputChange = (questionId: number, value: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };



  const fetchQuestions = async (e: any) => {
    setLevel(level);
    setLoading(true);
    const questionString = JSON.stringify(sampleQuestions);
    const prompt = `To enable us generate a more relevant learning plan for a ${level} ${role} give me questions we can ask the user. Answers to this question will be fed back to an llm to generate a learning plan. Return ${noOfQuestions} questions in the following format:
    ${questionString}`;
    const response = await askBedrock(prompt);
    const content = JSON.parse(response);
    const generatedQuestions = content["questions"] ?? [];
    setQuestions(generatedQuestions);
    setLoading(false);
  };

  const askBedrock = async (prompt: string) => {
    const response = await client.queries.askBedrock({ prompt: prompt });
    const res = JSON.parse(response.data?.body!);
    const content = res.content[0].text;
    return content || null;
  };

  const generatePlan = async (event: any) => {
    setLoading(true);
    let answersString = `Given the following questions and answers, generate a learning plan for a ${level} ${role}:`;
    for (const [questionId, answer] of Object.entries(answers)) {
      let question = questions.find((q) => q.id === parseInt(questionId));
      if (!question) continue;
      answersString += `\nQuestion: ${question.text}; answer: ${answer}`;
    }

    const response = await askBedrock(answersString);
    setGeneratedPlan(response);
    setPlan(response);
    setLoading(false);
  };

  const handleModifiedPlan = (event: any) => {
    setPlan(event.target.value);
  };

  const createLearningPlan = async () => {
    setLoading(true);
    const createdPlan = await client.models.LearningPlan.create({
      role: role,
      level: level,
      plan: plan,
      status: "initial",
    });

    setLoading(false);
    return createdPlan;
  };


  return (
    <Authenticator>
      {({ signOut, user }) => (
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
                  options={['', 'Cloud Architect', 'Software Engineer', 'Product Designer']}
                  placeholder="Select a role"
                  onChange={(event) => handleRoleChange(event.target.value)}
                ></SelectField>

                <SelectField
                  label="Level"
                  options={['', 'Junior', 'Mid', 'Senior']}
                  placeholder="Select a level"
                  onChange={(event) => fetchQuestions(event.target.value)}
                ></SelectField>

                {questions.map((question) => (
                  <div key={question.id} >
                    <Label>{question.text}</Label>
                    <Input onBlur={(event) => handleInputChange(question.id, event.target.value)} />
                  </div>
                ))}

              </Flex>
              <Loader display={loading ? "block" : "none"} variation="linear" />

              <Flex direction="column" margin="large">
                <button onClick={generatePlan}>Submit</button>
              </Flex>
              <div hidden={!generatedPlan}>
                <Heading level={5}>Generated Plan</Heading>
                <Flex direction="column" gap="medium">
                  <TextAreaField label="" defaultValue={generatedPlan} rows={30} onChange={(event) => handleModifiedPlan(event.target.value)}></TextAreaField>
                  <button onClick={createLearningPlan}>Save Plan</button>
                </Flex>
              </div>
            </Card>
          </div>
          <h1>My LearningPlans</h1>
          <ul>
            {learningPlans.map((learningPlan) => (
              <li key={learningPlan.id}>{learningPlan.role}</li>
            ))}
          </ul>
        </main>
      )}
    </Authenticator>
  );
}
