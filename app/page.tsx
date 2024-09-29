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
        text: "あなたの現在の専門知識のレベルはどのくらいですか?",
      },
      {
        id: 2,
        text: "聴衆の前でプレゼンテーションをすることにどれくらい慣れていますか?",
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
    const prompt = `${level} ${role} のより適切な学習プランを生成できるようにするには、ユーザーに尋ねることができる質問を入力してください。この質問への回答は、学習プランを生成するために生成AIにフィードバックされます。次の形式で ${noOfQuestions} 個の質問を返します:
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
    let answersString = `次の質問と回答に基づいて、${level} ${role} の学習計画を生成します:`;
    for (const [questionId, answer] of Object.entries(answers)) {
      let question = questions.find((q) => q.id === parseInt(questionId));
      if (!question) continue;
      answersString += `\n質問: ${question.text}; 回答: ${answer}`;
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
              <Heading level={3}>学習計画の生成</Heading>
              <Heading level={5}>
                学習計画を生成するには、次のフォームに記入してください。
              </Heading>
              <Flex direction="column" gap="small">
                <SelectField
                  label="職種"
                  options={['', 'クラウドアーキテクト', 'ソフトウェアエンジニア', 'プロダクトデザイナー']}
                  placeholder="職種を選んでください"
                  onChange={(event) => handleRoleChange(event.target.value)}
                ></SelectField>

                <SelectField
                  label="階層"
                  options={['', 'ジュニア', 'ミッド', 'シニア']}
                  placeholder="階層を選んでください"
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
                <Heading level={5}>生成された計画</Heading>
                <Flex direction="column" gap="medium">
                  <TextAreaField label="" defaultValue={generatedPlan} rows={30} onChange={(event) => handleModifiedPlan(event.target.value)}></TextAreaField>
                  <button onClick={createLearningPlan}>Save Plan</button>
                </Flex>
              </div>
            </Card>
          </div>
          <h1>私の学習計画</h1>
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
