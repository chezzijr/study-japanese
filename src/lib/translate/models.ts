export type ProviderName = 'claude' | 'gemini' | 'openai';

export interface ModelOption {
	id: string;
	provider: ProviderName;
	label: string;
	inputPrice: string;
	outputPrice: string;
}

export const MODEL_REGISTRY: ModelOption[] = [
	// Gemini
	{
		id: 'gemini-2.5-flash-lite',
		provider: 'gemini',
		label: 'Gemini 2.5 Flash Lite',
		inputPrice: '$0.10',
		outputPrice: '$0.40'
	},
	{
		id: 'gemini-2.5-flash',
		provider: 'gemini',
		label: 'Gemini 2.5 Flash',
		inputPrice: '$0.30',
		outputPrice: '$2.50'
	},
	{
		id: 'gemini-3-flash-preview',
		provider: 'gemini',
		label: 'Gemini 3 Flash',
		inputPrice: '$0.50',
		outputPrice: '$3.00'
	},
	// Claude
	{
		id: 'claude-haiku-4-5',
		provider: 'claude',
		label: 'Claude Haiku 4.5',
		inputPrice: '$1.00',
		outputPrice: '$5.00'
	},
	{
		id: 'claude-sonnet-4-6',
		provider: 'claude',
		label: 'Claude Sonnet 4.6',
		inputPrice: '$3.00',
		outputPrice: '$15.00'
	},
	// OpenAI
	{
		id: 'gpt-4o-mini',
		provider: 'openai',
		label: 'GPT-4o Mini',
		inputPrice: '$0.15',
		outputPrice: '$0.60'
	},
	{
		id: 'gpt-5.4-nano',
		provider: 'openai',
		label: 'GPT-5.4 Nano',
		inputPrice: '$0.20',
		outputPrice: '$1.25'
	},
	{
		id: 'gpt-5.4-mini',
		provider: 'openai',
		label: 'GPT-5.4 Mini',
		inputPrice: '$0.75',
		outputPrice: '$4.50'
	}
];

export function getProviderForModel(modelId: string): ProviderName {
	const model = MODEL_REGISTRY.find((m) => m.id === modelId);
	if (!model) throw new Error(`Unknown model: ${modelId}`);
	return model.provider;
}
