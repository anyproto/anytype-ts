import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AiSettings from './aiSettings';

interface SeededProps {
	enabled: boolean;
	providerId: string;
	endpoint: string;
	model: string;
	token: string;
	includeContentSamples: boolean;
};

// Seeds the persisted settings the component reads, then renders it
const Seeded = (props: SeededProps) => {
	U.Data.setImportAiSettings({
		enabled: props.enabled,
		providerId: props.providerId,
		endpoint: props.endpoint,
		model: props.model,
		token: props.token,
		includeContentSamples: props.includeContentSamples,
	});

	return <AiSettings />;
};

const meta: Meta<typeof Seeded> = {
	title: 'Page/Settings/ImportAiSettings',
	component: Seeded,
	tags: [ 'autodocs' ],
	argTypes: {
		providerId: {
			control: 'select',
			options: U.AiProvider.getList().map(it => it.id),
		},
	},
	decorators: [
		(Story) => (
			<div className="pageSettingsImportIndex" style={{ maxWidth: 640 }}>
				<div className="sections">
					<Story />
				</div>
			</div>
		),
	],
};

export { meta as default };
type Story = StoryObj<typeof meta>;

const base = {
	enabled: true,
	providerId: 'ollama',
	endpoint: '',
	model: 'qwen3:8b',
	token: '',
	includeContentSamples: false,
};

export const Disabled: Story = {
	args: { ...base, enabled: false, model: '' },
};

// Local provider: shield in the closed select, no API key field
export const LocalOllama: Story = {
	args: { ...base },
};

export const LocalLMStudio: Story = {
	args: { ...base, providerId: 'lmstudio', model: 'qwen2.5-7b-instruct' },
};

// Cloud provider with no key yet — the token warning wins over the model warning
export const CloudMissingToken: Story = {
	args: { ...base, providerId: 'openai', model: 'gpt-5.6-luna', token: '' },
};

export const CloudWithToken: Story = {
	args: { ...base, providerId: 'openai', model: 'gpt-6-astra', token: 'sk-storybook-placeholder' },
};

// An OpenAI-compatible service riding on the OpenAi wire enum
export const CloudGroq: Story = {
	args: { ...base, providerId: 'groq', model: 'llama-3.3-70b-versatile', token: 'gsk-storybook-placeholder' },
};

// Custom provider is the only one that shows the endpoint field
export const CustomProvider: Story = {
	args: { ...base, providerId: 'custom', endpoint: 'https://gateway.example/v1', model: 'my-model' },
};

export const CustomProviderNoEndpoint: Story = {
	args: { ...base, providerId: 'custom', endpoint: '', model: '' },
};

// An API key over plain http to a remote host puts it on the wire in clear
export const CustomProviderInsecure: Story = {
	args: { ...base, providerId: 'custom', endpoint: 'http://gateway.example/v1', model: 'my-model' },
};

export const WithSamples: Story = {
	args: { ...base, includeContentSamples: true },
};
