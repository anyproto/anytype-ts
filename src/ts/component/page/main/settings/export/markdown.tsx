import React, { forwardRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Switch } from 'Component';
import { I, translate, Storage } from 'Lib';

const PageMainSettingsExportMarkdown = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { onExport } = props;
	const [ data, setData ] = useState(Storage.get('popupExport') || {});
	const items = [
		{ id: 'zip', name: translate('popupExportZipArchive'), control: 'switch' },
		{ id: 'files', name: translate('popupExportIncludeFiles'), control: 'switch' },
		{ id: 'archived', name: translate('popupExportIncludeArchivedObjects'), control: 'switch' },
	];

	const save = (newData) => {
		setData(newData);
		Storage.set('popupExport', newData);
	};

	return (
		<>
			<Title text={translate('popupSettingsExportMarkdownTitle')} />

			<div className="labels">
				<Label text={translate('popupSettingsExportMarkdownText1')} />
				<Label text={translate('popupSettingsExportMarkdownText2')} />
			</div>

			<div className="actionItems">
				{items.map((item: any, i: number) => (
					<div key={i} className="item">
						<Label text={item.name} />

						<Switch
							className="big"
							value={data[item.id]}
							onChange={(e: any, v: boolean) => save({ ...data, [item.id]: v })}
						/>
					</div>
				))}
			</div>

			<div className="buttons">
				<Button 
					text={translate('popupSettingsExportOk')} 
					className="c36"
					onClick={() => onExport(I.ExportType.Markdown, data)} 
				/>
			</div>
		</>
	);

}));

export default PageMainSettingsExportMarkdown;