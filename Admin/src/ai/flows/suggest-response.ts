'use server';
/**
 * @fileOverview An AI agent that suggests responses based on the current conversation context.
 *
 * - suggestResponse - A function that handles the response suggestion process.
 * - SuggestResponseInput - The input type for the suggestResponse function.
 * - SuggestResponseOutput - The return type for the suggestResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResponseInputSchema = z.object({
  conversationHistory: z
    .string()
    .describe('The complete conversation history as a single string.'),
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

const SuggestResponseOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested responses based on the conversation history.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  return suggestResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponseInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `You are an AI assistant that provides helpful response suggestions based on the conversation history.

  Given the following conversation history, suggest three possible responses the user could send. Be concise and directly relevant to the conversation.

  Conversation History:
  {{conversationHistory}}

  Suggestions:
  `, 
});

const suggestResponseFlow = ai.defineFlow(
  {
    name: 'suggestResponseFlow',
    inputSchema: SuggestResponseInputSchema,
    outputSchema: SuggestResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
