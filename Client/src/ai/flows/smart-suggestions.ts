// use server'

/**
 * @fileOverview This file implements the Genkit flow for providing smart suggestions based on the current chat context.
 *
 * - getSmartSuggestions - A function that takes chat context as input and returns smart suggestions.
 * - SmartSuggestionsInput - The input type for the getSmartSuggestions function.
 * - SmartSuggestionsOutput - The return type for the getSmartSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSuggestionsInputSchema = z.object({
  chatContext: z
    .string()
    .describe('The current chat context, including recent messages.'),
});
export type SmartSuggestionsInput = z.infer<typeof SmartSuggestionsInputSchema>;

const SmartSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of smart suggestions based on the chat context.'),
});
export type SmartSuggestionsOutput = z.infer<typeof SmartSuggestionsOutputSchema>;

export async function getSmartSuggestions(input: SmartSuggestionsInput): Promise<SmartSuggestionsOutput> {
  return smartSuggestionsFlow(input);
}

const smartSuggestionsPrompt = ai.definePrompt({
  name: 'smartSuggestionsPrompt',
  input: {schema: SmartSuggestionsInputSchema},
  output: {schema: SmartSuggestionsOutputSchema},
  prompt: `You are a helpful assistant that provides smart suggestions based on the current chat context.

  Given the following chat context:
  {{chatContext}}

  Provide a list of suggestions that the user might find helpful. The suggestions should be short and concise.
  Format the output as a JSON array of strings.
  `, // Ensure valid JSON array of strings
});

const smartSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartSuggestionsFlow',
    inputSchema: SmartSuggestionsInputSchema,
    outputSchema: SmartSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await smartSuggestionsPrompt(input);
    return output!;
  }
);
