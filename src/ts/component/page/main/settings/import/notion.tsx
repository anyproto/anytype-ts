import React, { forwardRef, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { Title, Button, Input, Label, Icon, Error } from 'Component';
import { I, C, S, U, J, translate, analytics } from 'Lib';

const PageMainSettingsImportNotion = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { onPage } = props;
	const [ error, setError ] = useState('');
	const inputRef = useRef(null);

	const onImport = () => {
		const token = inputRef.current?.getValue();

		S.Common.notionTokenSet(token);
		analytics.event('ClickImport', { type: I.ImportType.Notion });

		C.ObjectImportNotionValidateToken(token, (message: any) => {
			if (message.error.code) {
				inputRef.current?.setError(true);
				setError(message.error.description);
				return;
			};

			onPage('importNotionWarning');
		});
	};

	return (
		<>
			<Icon className="logo" />
			<Title text={U.Menu.getImportNames()[I.ImportType.Notion]} />
			<Label className="description" text={translate('popupSettingsImportNotionDescription')} />

			<div className="inputWrapper flex">
				<div className="errorWrapper">
					<Input
						focusOnMount
						ref={inputRef}
						className="isMasked"
						placeholder={translate('popupSettingsImportNotionTokenPlaceholder')}
					/>
					{error ? <Error text={error} /> : ''}
				</div>
				<Button text={translate('popupSettingsImportData')} className="c36" onClick={onImport} />
			</div>

			<div className="line" />

			<div className="helpWrapper flex">
				<Title text={U.String.sprintf(translate('popupSettingsImportNotionHowTo'), J.Url.notionFAQ)} />
				<div className="btn" onClick={() => onPage('importNotionHelp')}>
					<Icon className="help" />{translate('popupSettingsImportNotionStepByStepGuide')}
				</div>
			</div>

			<ol className="list">
				<li>
					<Label text={translate('popupSettingsImportNotionIntegrationList11')} />
					<Label className="grey" text={translate('popupSettingsImportNotionIntegrationList12')} />
				</li>
				<li>
					<Label text={translate('popupSettingsImportNotionIntegrationList21')} />
					<Label className="grey" text={translate('popupSettingsImportNotionIntegrationList22')} />
				</li>
				<li>
					<Label text={translate('popupSettingsImportNotionIntegrationList31')} />
					<Label className="grey" text={translate('popupSettingsImportNotionIntegrationList32')} />
				</li>
			</ol>
		</>
	);
	
}));

export default PageMainSettingsImportNotion;