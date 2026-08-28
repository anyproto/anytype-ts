import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AiSettings from './aiSettings';
import * as I from 'Interface';

interface SeededProps {
	enabled: boolean;
	provider: I.AiProvider;
	model: string;
	token: string;
	includeContentSamples: boolean;
};

// Seeds the persisted settings the component reads, then renders it
const Seeded = (props: SeededProps) => {
	U.Data.setImportAiSettings({
		enabled: props.enabled,
		provider: props.provider,
		endpoint: '',
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
		provider: {
			control: 'select',
			options: [
				I.AiProvider.Ollama,
				I.AiProvider.OpenAi,
				I.AiProvider.LMStudio,
				I.AiProvider.LlamaCpp,
			],
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

export const Disabled: Story = {
	args: {
		enabled: false,
		provider: I.AiProvider.Ollama,
		model: '',
		token: '',
		includeContentSamples: false,
	},
};

export const Ollama: Story = {
	args: {
		enabled: true,
		provider: I.AiProvider.Ollama,
		model: 'qwen3:8b',
		token: '',
		includeContentSamples: false,
	},
};

export const OpenAiMissingToken: Story = {
	args: {
		enabled: true,
		provider: I.AiProvider.OpenAi,
		model: 'gpt-4o-mini',
		token: '',
		includeContentSamples: false,
	},
};

export const WithSamples: Story = {
	args: {
		enabled: true,
		provider: I.AiProvider.Ollama,
		model: 'qwen3:8b',
		token: '',
		includeContentSamples: true,
	},
};
