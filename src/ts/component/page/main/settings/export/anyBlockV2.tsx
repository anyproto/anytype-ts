import React, { forwardRef, useState } from 'react';
import { Title, Label, Button, Switch } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';
import ExportFilesHelp from 'Component/util/exportFilesHelp';

const PageMainSettingsExportAnyBlockV2 = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { onExport } = props;
	const [ data, setData ] = useState(Storage.get('popupExport') || {});
	const items = [
		{ id: 'zip', name: translate('popupExportZipArchive'), control: 'switch' },
		{ id: 'files', name: translate('popupExportIncludeFilesData'), control: 'switch' },
		{ id: 'archived', name: translate('popupExportIncludeArchivedObjects'), control: 'switch' },
	];

	const save = (newData) => {
		setData(newData);
		Storage.set('popupExport', newData);
	};

	return (
		<>
			<Title text={translate('popupSettingsExportAnyBlockV2Title')} />

			<div className="notice">
				<Label className="name" text={translate('exportAnyBlockV2NoticeTitle')} />
				<Label className="descr" text={translate('exportAnyBlockV2NoticeText')} />
			</div>

			<div className="actionItems">
				{items.map((item: any, i: number) => (
					<div key={i} className="item">
						<div className="flex">
							<Label text={item.name} />
							{item.id == 'files' ? <ExportFilesHelp /> : ''}
						</div>

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
					size={36}
					onClick={() => onExport(I.ExportType.AnyBlockV2, data)} 
				/>
			</div>
		</>
	);

});

export default PageMainSettingsExportAnyBlockV2;
