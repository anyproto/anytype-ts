import React, { FC, useState } from 'react';
import { Title, Label, Input, Select, Switch, Error } from 'Component';
import * as I from 'Interface';

const PageMainSettingsImportAiSettings: FC = () => {

	const [ settings, setSettings ] = useState(U.Data.getImportAiSettings());
	const { enabled, provider, endpoint, model, token, includeContentSamples } = settings;
	const isAnytype = provider == I.AiProvider.Anytype;
	const isOpenAi = provider == I.AiProvider.OpenAi;
	const isRemoteHttp = endpoint.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1|\[?::1)/.test(endpoint);

	const save = (patch: Partial<I.ImportAiSettings>) => {
		U.Data.setImportAiSettings(patch);
		setSettings(U.Data.getImportAiSettings());
	};

	const providers: I.Option[] = [];
	if (U.Data.isImportAiAnytypeAvailable()) {
		providers.push({ id: String(I.AiProvider.Anytype), name: translate('popupSettingsImportAiProviderAnytype') });
	};
	providers.push(
		{ id: String(I.AiProvider.Ollama), name: 'Ollama' },
		{ id: String(I.AiProvider.LMStudio), name: 'LM Studio' },
		{ id: String(I.AiProvider.LlamaCpp), name: 'llama.cpp' },
		{ id: String(I.AiProvider.OpenAi), name: 'OpenAI' },
	);

	let warning = '';
	if (enabled && !isAnytype) {
		if (!model) {
			warning = translate('popupSettingsImportAiModelWarning');
		} else
		if (isOpenAi && !token) {
			warning = translate('popupSettingsImportAiTokenWarning');
		} else
		if (isOpenAi && isRemoteHttp) {
			warning = translate('popupSettingsImportAiHttpWarning');
		};
	};

	let disclosureKey = 'popupSettingsImportAiDisclosure';
	if (isAnytype) {
		disclosureKey += 'Anytype';
	};
	if (includeContentSamples) {
		disclosureKey += 'Samples';
	};

	return (
		<div className="section aiSettings">
			<Title className="sub" text={translate('popupSettingsImportAiTitle')} />
			<Label className="description" text={translate('popupSettingsImportAiApplies')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsImportAiToggle')} />
					<Switch
						className="big"
						value={enabled}
						onChange={(e: any, v: boolean) => {
							save({ enabled: v });
							analytics.event(v ? 'EnableImportAi' : 'DisableImportAi');
						}}
					/>
				</div>

				{enabled ? (
					<>
						<div className="item">
							<Label text={translate('popupSettingsImportAiProvider')} />
							<Select
								id="importAiProvider"
								value={String(provider)}
								options={providers}
								onChange={(v: string) => save({ provider: Number(v) })}
								arrowClassName="black"
								menuParam={{ horizontal: I.MenuDirection.Right }}
							/>
						</div>

						{!isAnytype ? (
							<>
								<div className="item">
									<Label text={translate('popupSettingsImportAiEndpoint')} />
									<Input
										value={endpoint}
										placeholder={J.Constant.importAiEndpoint[provider]}
										onChange={(e: any, v: string) => save({ endpoint: v.trim() })}
									/>
								</div>

								<div className="item">
									<Label text={translate('popupSettingsImportAiModel')} />
									<Input
										value={model}
										placeholder="qwen3:8b"
										onChange={(e: any, v: string) => save({ model: v.trim() })}
									/>
								</div>

								{isOpenAi ? (
									<div className="item">
										<Label text={translate('popupSettingsImportAiToken')} />
										<Input
											className="isMasked"
											value={token}
											onChange={(e: any, v: string) => save({ token: v.trim() })}
										/>
									</div>
								) : ''}
							</>
						) : ''}

						<div className="item">
							<Label text={translate('popupSettingsImportAiSamples')} />
							<Switch
								className="big"
								value={includeContentSamples}
								onChange={(e: any, v: boolean) => save({ includeContentSamples: v })}
							/>
						</div>
					</>
				) : ''}
			</div>

			<Error text={warning} />

			{enabled ? (
				<Label className="disclosure" text={[ translate(disclosureKey), translate('popupSettingsImportAiReportHint') ].join(' ')} />
			) : ''}
		</div>
	);

};

export default PageMainSettingsImportAiSettings;
