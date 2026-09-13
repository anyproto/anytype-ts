import React, { FC, useState, useEffect, useRef } from 'react';
import { Title, Label, Input, Select, Switch, Error } from 'Component';
import * as I from 'Interface';

// Endpoint and token are typed by hand; waiting out the keystrokes keeps this
// from firing a request per character
const DELAY = 700;

const PageMainSettingsImportAiSettings: FC = () => {

	const [ settings, setSettings ] = useState(U.Data.getImportAiSettings());
	const [ models, setModels ] = useState<string[]>([]);
	const [ errorCode, setErrorCode ] = useState(I.AiListModelsErrorCode.None);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ isModelFreeText, setIsModelFreeText ] = useState(false);
	const timeout = useRef(0);
	const requestRef = useRef('');
	const modelRef = useRef(null);

	const { enabled, providerId, endpoint, model, token, includeContentSamples } = settings;
	const item = U.AiProvider.get(providerId);
	const isAnytype = !!item.isAnytype;
	const isCustom = !!item.isCustom;
	const needsToken = !!item.needsToken;
	const listConfig = U.AiProvider.resolveListConfig(settings);

	// Sending an API key over plain http to a remote host puts it on the wire in clear
	const isRemoteHttp = endpoint.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1|\[?::1)/.test(endpoint);

	const save = (patch: Partial<I.ImportAiSettings>) => {
		U.Data.setImportAiSettings(patch);
		setSettings(U.Data.getImportAiSettings());
	};

	/**
	 * ListModels both fills the dropdown and validates the config — a successful
	 * response proves the endpoint is reachable and the token works, so there is
	 * no separate check to run.
	 */
	useEffect(() => {
		window.clearTimeout(timeout.current);

		if (!enabled || isAnytype || !listConfig) {
			setModels([]);
			setErrorCode(I.AiListModelsErrorCode.None);
			setIsLoading(false);
			return;
		};

		// A provider/endpoint/token triple identifies the request; anything typed
		// afterwards supersedes it, so a slow reply can't overwrite a newer one
		const key = [ listConfig.provider, listConfig.endpoint, listConfig.token ].join('\n');

		requestRef.current = key;
		setIsLoading(true);

		timeout.current = window.setTimeout(() => {
			C.AIListModels(listConfig, (message: any) => {
				if (requestRef.current != key) {
					return;
				};

				const code = message.error.code;

				setIsLoading(false);
				setErrorCode(code);
				setModels(code ? [] : (message.models || []).map(it => it.id));
			});
		}, DELAY);

		return () => window.clearTimeout(timeout.current);
	}, [ enabled, providerId, endpoint, token, isAnytype ]);

	const getProviderOptions = (): I.Option[] => {
		const ret: I.Option[] = [];
		const list = U.AiProvider.getList();
		const local = list.filter(it => it.isLocal);
		const cloud = list.filter(it => !it.isLocal && !it.isCustom);

		if (U.Data.isImportAiAnytypeAvailable()) {
			ret.push({ id: 'anytype', name: translate('popupSettingsImportAiProviderAnytype') });
		};

		ret.push({ id: 'sectionLocal', name: translate('popupSettingsImportAiSectionLocal'), isSection: true });
		local.forEach(it => ret.push({
			id: it.id,
			name: it.name,
			iconParam: { name: 'import/local', size: 18, className: 'isLocal' },
		}));

		ret.push({ id: 'sectionCloud', name: translate('popupSettingsImportAiSectionCloud'), isSection: true });
		cloud.forEach(it => ret.push({ id: it.id, name: it.name }));

		ret.push({ id: 'divCustom', name: '', isDiv: true });
		ret.push({ id: 'custom', name: translate('popupSettingsImportAiProviderCustom') });

		return ret;
	};

	/**
	 * Recommended models sit above the rest. They are a filter over what the
	 * provider actually returned, so a retired model drops out on its own.
	 */
	const getModelOptions = (): I.Option[] => {
		const recommended = U.AiProvider.getRecommended(providerId, models).filter(it => it.isInstalled);
		const rest = models.filter(m => !recommended.some(it => it.id == m));

		// Carried as a real option rather than Select's `initial` prop: `initial` is
		// prepended inside getOptions() and would be dropped by setOptions() below.
		// isInitial keeps it unselectable.
		const ret: I.Option[] = [
			{ id: '', name: translate('popupSettingsImportAiModelPlaceholder'), isInitial: true } as I.Option,
		];

		if (recommended.length) {
			ret.push({ id: 'sectionRecommended', name: translate('popupSettingsImportAiModelRecommended'), isSection: true });
			recommended.forEach(it => ret.push({ id: it.id, name: it.name }));
		};

		if (rest.length) {
			ret.push({ id: 'sectionAll', name: translate('popupSettingsImportAiModelAll'), isSection: true });
			rest.forEach(it => ret.push({ id: it, name: it }));
		};

		ret.push({ id: 'divModel', name: '', isDiv: true });
		ret.push({ id: 'custom', name: translate('popupSettingsImportAiModelCustom') });

		return ret;
	};

	// Select reads `options` into state once on mount, so a list that arrives later
	// has to be pushed in through the ref — same pattern as the other call sites
	// with async options (settings/language, import/csv, widget/view).
	useEffect(() => {
		modelRef.current?.setOptions(getModelOptions());
	}, [ models, providerId ]);

	// Shown above the selector rather than inside it: a model you do not have yet
	// cannot be picked, but it is exactly what you need to be told about.
	const getSuggestedText = (): string => {
		const list = U.AiProvider.getRecommended(providerId, models);

		if (!item.isLocal || !list.length) {
			return '';
		};

		return list.map(it => it.noteKey ? `${it.name} (${translate(it.noteKey)})` : it.name).join(', ');
	};

	const onModelSelect = (v: string) => {
		if (v == 'custom') {
			setIsModelFreeText(true);
		} else {
			setIsModelFreeText(false);
			save({ model: v });
		};
	};

	// A fetch that never succeeded leaves nothing to pick from, so the field has
	// to stay typeable — a gateway that doesn't implement /models must not lock
	// the user out of a model name they already know
	const hasOptions = !!models.length;
	const showModelInput = isModelFreeText || (!hasOptions && !isLoading);

	const getErrorText = (): string => {
		switch (errorCode) {
			case I.AiListModelsErrorCode.NotReachable: return translate('popupSettingsImportAiErrorUnreachable');
			case I.AiListModelsErrorCode.AuthRequired: return translate('popupSettingsImportAiErrorAuth');
			case I.AiListModelsErrorCode.RateLimit: return translate('popupSettingsImportAiErrorRateLimit');
			case I.AiListModelsErrorCode.None: return '';
			default: return translate('popupSettingsImportAiErrorUnknown');
		};
	};

	const suggested = getSuggestedText();

	let warning = '';
	if (enabled && !isAnytype) {
		if (isCustom && !endpoint) {
			warning = translate('popupSettingsImportAiEndpointWarning');
		} else
		if (needsToken && !token) {
			warning = translate('popupSettingsImportAiTokenWarning');
		} else
		if (needsToken && isRemoteHttp) {
			warning = translate('popupSettingsImportAiHttpWarning');
		} else
		if (errorCode) {
			warning = getErrorText();
		} else
		if (!model) {
			warning = translate('popupSettingsImportAiModelWarning');
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
								value={providerId}
								options={getProviderOptions()}
								onChange={(v: string) => {
									// The model belongs to the provider that served it
									setIsModelFreeText(false);
									save({ providerId: v, model: '' });
									modelRef.current?.setValue('');
								}}
								arrowClassName="black"
								menuParam={{ horizontal: I.MenuDirection.Right }}
							/>
						</div>

						{!isAnytype ? (
							<>
								{isCustom ? (
									<div className="item">
										<Label text={translate('popupSettingsImportAiEndpoint')} />
										<Input
											value={endpoint}
											placeholder="https://"
											onChange={(e: any, v: string) => save({ endpoint: v.trim() })}
										/>
									</div>
								) : ''}

								{needsToken ? (
									<div className="item">
										<Label text={translate('popupSettingsImportAiToken')} />
										<Input
											className="isMasked"
											value={token}
											onChange={(e: any, v: string) => save({ token: v.trim() })}
										/>
									</div>
								) : ''}

								{suggested ? (
									<div className="item suggested">
										<Label text={translate('popupSettingsImportAiModelSuggested')} />
										<Label className="value" text={suggested} />
									</div>
								) : ''}

								<div className="item">
									<Label text={translate('popupSettingsImportAiModel')} />

									{showModelInput ? (
										<Input
											value={model}
											placeholder={isLoading ? translate('popupSettingsImportAiModelsLoading') : 'qwen3:8b'}
											onChange={(e: any, v: string) => save({ model: v.trim() })}
										/>
									) : (
										<Select
											ref={modelRef}
											id="importAiModel"
											value={model}
											options={getModelOptions()}
											onChange={onModelSelect}
											arrowClassName="black"
											menuParam={{ horizontal: I.MenuDirection.Right }}
										/>
									)}
								</div>
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
