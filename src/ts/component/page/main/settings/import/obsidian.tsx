import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Button, Label, Icon, Error } from 'Component';
import { I, U, J, translate, Action } from 'Lib';

const PageMainSettingsImportObsidian = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const [ error, setError ] = useState<string>('');

	const onImport = () => {
		Action.import(I.ImportType.Obsidian, J.Constant.fileExtension.import[I.ImportType.Markdown], {}, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
			} else {
				U.Space.openDashboard();
			};
		});
	};

	return (
		<>
			<Icon className="logo" />
			<Title text={U.Menu.getImportNames()[I.ImportType.Obsidian]} />
			<Label className="description" text={translate('popupSettingsImportObsidianDescription')} />

			<div className="inputWrapper flex">
				<Button text={translate('popupSettingsImportFiles')} className="c36" onClick={onImport} />
			</div>

			<Error text={error} />

			<div className="line" />

			<div className="helpWrapper flex">
				<Title text={translate('popupSettingsImportObsidianHowTo')} />
			</div>

			<ol className="list">
				<li>
					<Label text={translate('popupSettingsImportObsidianList11')} />
					<Label className="grey" text={translate('popupSettingsImportObsidianList12')} />
				</li>
				<li>
					<Label text={translate('popupSettingsImportObsidianList21')} />
					<Label className="grey" text={translate('popupSettingsImportObsidianList22')} />
				</li>
				<li>
					<Label text={translate('popupSettingsImportObsidianList31')} />
					<Label className="grey" text={translate('popupSettingsImportObsidianList32')} />
				</li>
			</ol>
		</>
	);
	
}));

export default PageMainSettingsImportObsidian;