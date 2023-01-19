import * as React from 'react';
import { I, Action, keyboard } from 'Lib';
import { Title, Select, Button, Switch } from 'Component';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

const PopupExport = observer(class PopupExport extends React.Component<I.Popup> {

	format: I.ExportFormat = I.ExportFormat.Markdown;
	zip = false;
	nested = false;
	files = true;
	landscape = false;
	pageSize: any = { id: 'A4', name: 'A4'};
	printBackground = true;

	constructor (props: I.Popup) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { config } = commonStore;
		const formats = [
			{ id: I.ExportFormat.Markdown, name: 'Markdown' },
			{ id: I.ExportFormat.Pdf, name: 'PDF' },
		];

		if (config.experimental) {
			formats.push({ id: I.ExportFormat.Html, name: 'HTML' });
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
							value={this[item.id].id}
							options={item.options}
							onChange={(v: any) => {
								this[item.id] = v;
								this.save();
							}}
							arrowClassName="light"
							menuWidth={300}
							isMultiple={false}
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
			case I.ExportFormat.Markdown:
				items = [
					{ id: 'zip', name: 'Zip archive', control: 'switch' },
					{ id: 'nested', name: 'Include linked objects', control: 'switch' },
					{ id: 'files', name: 'Include files', control: 'switch' },
				];
				break;

			case I.ExportFormat.Pdf:
				items = [
					{ id: 'pageSize', name: 'Page size', control: 'select', options: pageSize },
					{ id: 'landscape', name: 'Landscape', control: 'switch' },
					{ id: 'printBackground', name: 'Print background', control: 'switch' },
				];
				break;
		};

		return (
			<React.Fragment>
				<Title text="Export" />

				<div className="row">
					<div className="name">Export format</div>
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
					<Button color="orange" text="Export" onClick={this.onConfirm} />
					<Button color="blank" text="Cancel" onClick={this.onCancel} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.init();
	};

	init () {
		const { storageGet } = this.props;
		const options = storageGet();

		this.format = Number(options.format) || I.ExportFormat.Markdown;
		this.zip = Boolean(options.zip);
		this.nested = Boolean(options.nested);
		this.files = Boolean(options.files);
	};

	save () {
		const { storageSet } = this.props;

		storageSet({ format: this.format, zip: this.zip, nested: this.nested, files: this.files });
	};

	onConfirm (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;

		switch (this.format) {
			default:
				Action.export([ rootId ], this.format, this.zip, this.nested, this.files);
				break;

			case I.ExportFormat.Html:
				keyboard.onSaveAsHTML();
				break;

			case I.ExportFormat.Pdf:
				keyboard.onPrintToPDF({
					landscape: this.landscape,
					printBackground: this.printBackground,
					pageSize: this.pageSize.id
				});
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