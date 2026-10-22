import React, { forwardRef, useState, useRef } from 'react';
import { Title, Button, Input, Label, Icon, Error } from 'Component';
import * as I from 'Interface';
import Back from '../back';

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

	// Only the two steps that happen on a Notion screen carry a shot; the first is a
	// link and the last happens back here
	const steps = [
		{ id: 1, url: J.Url.notionTokens },
		{ id: 2, image: 'tokens' },
		{ id: 3, image: 'create' },
		{ id: 4 },
	];

	return (
		<>
			<Icon name="import/notion" className="logo" size={56} />
			<Title text={U.Menu.getImportNames()[I.ImportType.Notion]} />
			<Back page="importIndex" />
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
				{steps.map(item => (
					<li key={item.id}>
						<Label text={translate(`popupSettingsImportNotionHelpStep1${item.id}`)} />
						{item.url ? <a className="url" href={item.url}>{item.url}</a> : ''}
						{item.image ? <img src={`./img/help/notion/${item.image}.jpg`} /> : ''}
					</li>
				))}
			</ol>
		</>
	);

});

export default PageMainSettingsImportNotion;
