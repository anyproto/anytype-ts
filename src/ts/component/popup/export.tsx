import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { I, S, Action, keyboard, analytics, translate } from 'Lib';
import { Title, Select, Button, Switch } from 'Component';
import { observer } from 'mobx-react';

const PopupExport = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { space } = S.Common;
	const { param, close, position, storageGet, storageSet } = props;
	const { data } = param;
	const { allowHtml, objectIds, route } = data;
	const [ dummy, setDummy ] = useState(0);
	const theme = S.Common.getThemeClass();
	const update = useRef<any>({});

	const pageSize = [
		{ id: 'A3', name: 'A3'},
		{ id: 'A4', name: 'A4'},
		{ id: 'A5', name: 'A5'},
		{ id: 'legal', name: 'Legal'},
		{ id: 'letter', name: 'Letter'},
		{ id: 'tabloid', name: 'Tabloid'},
	];

	const formatOptions = [
		{ id: 'json', name: 'JSON'},
		{ id: 'pb', name: 'Protobuf'},
	];

	const Option = (item: any) => {
		let control = null;

		switch (item.control) {
			case 'switch': {
				control = (
					<Switch
						className="big"
						value={update.current[item.id]}
						onChange={(e: any, v: boolean) => {
							update.current[item.id] = v;
							save();
						}}
					/>
				);
				break;
			};

			case 'select': {
				let value = update.current[item.id];
				if (item.id == 'json') {
					value = value ? 'json' : 'pb';
				};

				control = (
					<Select
						id={item.id}
						value={value}
						options={item.options}
						onChange={(v: any) => {
							if (item.id == 'json') {
								v = (v == 'json') ? true : false;
							};

							update.current[item.id] = v;
							save();
							setDummy(dummy + 1);
						}}
						arrowClassName="light"
						isMultiple={false}
						menuParam={{ width: 300 }}
					/>
				);
				break;
			};
		};

		return (
			<div className="row">
				<div className="name">{item.name}</div>
				<div className="value">
					{control}
				</div>
			</div>
		);
	};

	const init = () => {
		const options = storageGet();
		const formats = getFormats();

		let format = Number(options.format);
		if (!formats.map(it => it.id).includes(format)) {
			format = formats[0].id;
		};

		update.current = {
			format,
			zip:				 Boolean(options.zip),
			nested:				 Boolean(options.nested),
			files:				 Boolean(options.files),
			archived:			 Boolean(options.archived),
			json:				 (undefined === options.json) ? true : Boolean(options.json),
			landscape:			 Boolean(options.landscape),
			printBackground:	 Boolean(options.printBackground),
			pageSize:			 String(options.pageSize || 'A4'),
		};
	};

	const getFormats = () => {
		const { config } = S.Common;

		return [
			{ id: I.ExportType.Markdown, name: 'Markdown' },
			{ id: I.ExportType.Protobuf, name: 'Any-Block' },
			allowHtml ? { id: I.ExportType.Pdf, name: 'PDF' } : null,
			allowHtml && config.experimental ? { id: I.ExportType.Html, name: 'HTML' } : null,
		].filter(it => it);
	};

	const save = () => {
		storageSet(update.current);
	};

	const onConfirm = (e: any) => {
		const { format } = update.current;

		analytics.event('ClickExport', { type: format, route });

		switch (format) {
			default:
				Action.export(space, objectIds, format, { ...update.current, route });
				close();
				break;

			case I.ExportType.Html:
				keyboard.onSaveAsHTML();
				analytics.event('Export', { type: format, route });
				break;

			case I.ExportType.Pdf:
				keyboard.onPrintToPDF({ ...update.current });
				analytics.event('Export', { type: format, route });
				break;
		};
		
		save();
	};

	init();

	const { format } = update.current;
	const formats = getFormats();

	let items: any[] = [
		{ id: 'format', name: translate('popupExportFormat'), control: 'select', options: formats },
	];

	switch (format) {
		case I.ExportType.Markdown:
		case I.ExportType.Protobuf:
			if (format == I.ExportType.Protobuf) {
				items.push({ id: 'json', name: translate('popupExportFileFormat'), control: 'select', options: formatOptions });
			};

			items = items.concat([
				{ id: 'zip', name: translate('popupExportZipArchive'), control: 'switch' },
				{ id: 'nested', name: translate('popupExportIncludeLinkedObjects'), control: 'switch' },
				{ id: 'files', name: translate('popupExportIncludeFiles'), control: 'switch' },
				{ id: 'archived', name: translate('popupExportIncludeArchivedObjects'), control: 'switch' },
			]);
			break;

		case I.ExportType.Pdf:
			items = items.concat([
				{ id: 'pageSize', name: translate('popupExportPageSize'), control: 'select', options: pageSize },
				{ id: 'landscape', name: translate('popupExportLandscape'), control: 'switch' },
				(!theme ? { id: 'printBackground', name: translate('popupExportPrintBackground'), control: 'switch' } : null),
			]);
			break;
	};

	items = items.filter(it => it);

	useEffect(() => {
		init();
	}, []);

	useEffect(() => {
		position();
	});

	return (
		<>
			<Title text={translate('popupExportTitle')} />

			{items.map((item: any, i: number) => (
				<Option key={i} {...item} />
			))}

			<div className="buttons">
				<Button text={translate('popupExportOk')} onClick={onConfirm} />
				<Button color="blank" text={translate('commonCancel')} onClick={() => close()} />
			</div>
		</>
	);

}));

export default PopupExport;