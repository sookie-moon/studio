'use server';
/**
 * @fileOverview Implements an AI-powered answer evaluator for the Hangman game.
 *
 * - evaluateAnswer - A function that evaluates the player's answer using AI.
 * - EvaluateAnswerInput - The input type for the evaluateAnswer function.
 * - EvaluateAnswerOutput - The return type for the evaluateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateAnswerInputSchema = z.object({
  playerAnswer: z.string().describe('The answer provided by the player.'),
  correctAnswer: z.string().describe('The actual correct answer.'),
});
export type EvaluateAnswerInput = z.infer<typeof EvaluateAnswerInputSchema>;

const EvaluateAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the player answer is correct or not.'),
  reason: z.string().describe('The reasoning behind the evaluation.'),
});
export type EvaluateAnswerOutput = z.infer<typeof EvaluateAnswerOutputSchema>;

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluateAnswerOutput> {
  return evaluateAnswerFlow(input);
}

const evaluateAnswerPrompt = ai.definePrompt({
  name: 'evaluateAnswerPrompt',
  input: {schema: EvaluateAnswerInputSchema},
  output: {schema: EvaluateAnswerOutputSchema},
  prompt: `You are an expert evaluator for a word guessing game and your task is to determine whether the player's answer is correct based on the correct answer.

  Player's Answer: {{{playerAnswer}}}
  Correct Answer: {{{correctAnswer}}}

  Consider slight variations in wording, synonyms, and factual differences.

  Return a JSON object that indicates whether the answer is correct (isCorrect) and provides a brief explanation (reason) for your evaluation.
`,
});

const evaluateAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateAnswerFlow',
    inputSchema: EvaluateAnswerInputSchema,
    outputSchema: EvaluateAnswerOutputSchema,
  },
  async input => {
    const {output} = await evaluateAnswerPrompt(input);
    return output!;
  }
);
