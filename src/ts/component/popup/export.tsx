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
	pageSize = '';
	printBg = true;

	constructor (props: I.Popup) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { config } = commonStore;
		const formats = [
			{ id: I.ExportType.Markdown, name: 'Markdown' },
			{ id: I.ExportType.Protobuf, name: 'Protobuf' },
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

		const Option = (item: any) => {
			let control = null;

			switch (item.control) {
				case 'switch':
					control = (
						<Switch
							className="big"
							value={this[item.id]}
							onChange={(e: any, v: boolean) => {
								this[item.id] = v;
								this.save();
							}}
						/>
					);
					break;

				case 'select':
					control = (
						<Select
							id={item.id}
							value={this[item.id]}
							options={item.options}
							onChange={(v: any) => {
								this[item.id] = v;
								this.save();
							}}
							arrowClassName="light"
							isMultiple={false}
							menuParam={{ width: 300 }}
						/>
					);
					break;
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

		let items: any[] = [];

		switch (this.format) {
			case I.ExportType.Markdown:
			case I.ExportType.Protobuf:
				items = [
					{ id: 'zip', name: translate('popupExportZipArchive'), control: 'switch' },
					{ id: 'nested', name: translate('popupExportIncludeLinkedObjects'), control: 'switch' },
					{ id: 'files', name: translate('popupExportIncludeFiles'), control: 'switch' },
					{ id: 'archived', name: translate('popupExportIncludeArchivedObjects'), control: 'switch' },
				];
				break;

			case I.ExportType.Pdf:
				items = [
					{ id: 'pageSize', name: translate('popupExportPageSize'), control: 'select', options: pageSize },
					{ id: 'landscape', name: translate('popupExportLandscape'), control: 'switch' },
					{ id: 'printBg', name: translate('popupExportPrintBackground'), control: 'switch' },
				];
				break;
		};

		return (
			<React.Fragment>
				<Title text={translate('popupExportExport')} />

				<div className="row">
					<div className="name">{translate('popupExportExportFormat')}</div>
					<div className="value">
						<Select 
							id="format" 
							value={this.format} 
							options={formats} 
							onChange={(v: any) => {
								this.format = v;
								this.save();
								this.forceUpdate();
							}}
						/>
					</div>
				</div>

				{items.map((item: any, i: number) => (
					<Option key={i} {...item} />
				))}

				<div className="buttons">
					<Button text={translate('popupExportExport')} onClick={this.onConfirm} />
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

		this.format = Number(options.format) || I.ExportType.Markdown;
		this.zip = Boolean(options.zip);
		this.nested = Boolean(options.nested);
		this.files = Boolean(options.files);
		this.archived = Boolean(options.archived);
		this.landscape = Boolean(options.landscape);
		this.printBg = Boolean(options.printBg);
		this.pageSize = String(options.pageSize || 'A4');
	};

	save () {
		const { storageSet } = this.props;
		const keys = [ 'format', 'zip', 'nested', 'files', 'archived', 'landscape', 'pageSize', 'printBg' ];
		const obj: any = {};

		for (const key of keys) {
			obj[key] = this[key];
		};

		storageSet(obj);
	};

	onConfirm (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;

		switch (this.format) {
			default:
				Action.export([ rootId ], this.format, this.zip, this.nested, this.files, this.archived);
				break;

			case I.ExportType.Html:
				keyboard.onSaveAsHTML();

				analytics.event('Export', { type: this.format });
				break;

			case I.ExportType.Pdf:
				keyboard.onPrintToPDF({ landscape: this.landscape, printBg: this.printBg, pageSize: this.pageSize });

				analytics.event('Export', { type: this.format });
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
