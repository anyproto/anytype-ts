import * as React from 'react';
import { I, Action, keyboard, analytics, translate } from 'Lib';
import { Title, Select, Button, Switch } from 'Component';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

const PopupExport = observer(class PopupExport extends React.Component<I.Popup> {

	format: I.ExportType = I.ExportType.Markdown;
	zip = false;
	nested = false;
	files = true;
	archived = true;
	landscape = false;
	json = false;
	pageSize = '';
	printBg = true;
	data: any = {};

	constructor (props: I.Popup) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { config } = commonStore;
		const formats = [
			{ id: I.ExportType.Markdown, name: 'Markdown' },
			{ id: I.ExportType.Protobuf, name: 'Any-Block' },
			{ id: I.ExportType.Pdf, name: 'PDF' },
		];

		if (config.experimental) {
			formats.push({ id: I.ExportType.Html, name: 'HTML' });
		};

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
							value={this[item.id]}
							onChange={(e: any, v: boolean) => {
								this.data[item.id] = v;
								this.save();
							}}
						/>
					);
					break;
				};

				case 'select': {
					let value = this.data[item.id];
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

								this.data[item.id] = v;
								this.save();
								this.forceUpdate();
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

		this.init();

		const { format } = this.data;

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
					{ id: 'printBg', name: translate('popupExportPrintBackground'), control: 'switch' },
				]);
				break;
		};

		return (
			<React.Fragment>
				<Title text={translate('popupExportTitle')} />

				{items.map((item: any, i: number) => (
					<Option key={i} {...item} />
				))}

				<div className="buttons">
					<Button text={translate('popupExportOk')} onClick={this.onConfirm} />
					<Button color="blank" text={translate('commonCancel')} onClick={this.onCancel} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.init();
	};

	componentDidUpdate () {
		this.props.position();
	};

	init () {
		const { storageGet } = this.props;
		const options = storageGet();

		this.data = {
			format:		 Number(options.format) || I.ExportType.Markdown,
			zip:		 Boolean(options.zip),
			nested:		 Boolean(options.nested),
			files:		 Boolean(options.files),
			archived:	 Boolean(options.archived),
			landscape:	 Boolean(options.landscape),
			printBg:	 Boolean(options.printBg),
			pageSize:	 String(options.pageSize || 'A4'),
		};
	};

	save () {
		this.props.storageSet(this.data);
	};

	onConfirm (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { format } = this.data;
		const route = 'MenuObject';

		analytics.event('ClickExport', { type: format, route });

		switch (this.format) {
			default:
				Action.export([ rootId ], format, { ...this.data, route });
				break;

			case I.ExportType.Html:
				keyboard.onSaveAsHTML();
				analytics.event('Export', { type: format, route });
				break;

			case I.ExportType.Pdf:
				keyboard.onPrintToPDF({ ...this.data });
				analytics.event('Export', { type: format, route });
				break;
		};
		
		this.save();
		close();
	};

	onCancel (e: any) {
		this.props.close();
	};
	
});

export default PopupExport;
