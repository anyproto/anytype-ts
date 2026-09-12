import React, { forwardRef, useState } from 'react';
import { Title, Label, Button, Switch, Select } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';
import ExportFilesHelp from 'Component/util/exportFilesHelp';

const PageMainSettingsExportProtobuf = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { onExport } = props;
	const [ data, setData ] = useState(Storage.get('popupExport') || {});
	const items = [
		{ id: 'zip', name: translate('popupExportZipArchive'), control: 'switch' },
		{ id: 'files', name: translate('popupExportIncludeFilesData'), control: 'switch' },
		{ id: 'archived', name: translate('popupExportIncludeArchivedObjects'), control: 'switch' },
	];
	const formatOptios = [
		{ id: 'json', name: 'JSON' },
		{ id: 'pb', name: 'Protobuf' },
	];

	data.json = (undefined === data.json) ? true : Boolean(data.json);

	const save = (newData) => {
		setData(newData);
		Storage.set('popupExport', newData);
	};

	return (
		<>
			<Title text={translate('popupSettingsExportProtobufTitle')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsExportProtobufFormat')} />

					<Select 
						id="file-format"
						value={data.json ? 'json' : 'pb'}
						options={formatOptios}
						onChange={(v: string) => save({ ...data, json: v == 'json' })}
					/>
				</div>

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
					onClick={() => onExport(I.ExportType.Protobuf, data)} 
				/>
			</div>
		</>
	);

});

export default PageMainSettingsExportProtobuf;
