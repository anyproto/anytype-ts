import React, { forwardRef, useState, useRef } from 'react';
import { Title, Button, Input, Label, Icon, Error } from 'Component';
import * as I from 'Interface';

const PageMainSettingsImportNotion = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

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

	const steps = [ 1, 2, 3, 4, 5, 6, 7 ];

	return (
		<>
			<Icon name="import/notion" className="logo" size={56} />
			<Title text={U.Menu.getImportNames()[I.ImportType.Notion]} />
			<Label
				className="description"
				text={U.String.sprintf(translate('popupSettingsImportNotionDescription'), J.Url.notionFAQ)}
			/>

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
				<Button color="accent" text={translate('popupSettingsImportData')} size={36} onClick={onImport} />
			</div>

			<Title className="howTo" text={translate('popupSettingsImportNotionHowTo')} />
			<Label className="step" text={U.String.sprintf(translate('popupSettingsImportNotionHelpStep'), 1)} />

			<ol className="list">
				{steps.map(n => (
					<li key={n}>
						<Label text={translate(`popupSettingsImportNotionHelpStep1${n}`)} />
						<img src={`./img/help/notion/step${n}.png`} />
					</li>
				))}
			</ol>
		</>
	);

});

export default PageMainSettingsImportNotion;
