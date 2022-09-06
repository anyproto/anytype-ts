import * as React from 'react';
import { I, Action, keyboard, Storage } from 'Lib';
import { Title, Select, Button, Switch } from 'Component';
import { commonStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.Popup {};

const PopupExport = observer(class PopupExport extends React.Component<Props, {}> {

	format: I.ExportFormat = I.ExportFormat.Markdown;
	zip: boolean = false;
	nested: boolean = false;
	files: boolean = true;

	constructor(props: any) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const { config } = commonStore;
		const formats = [
			{ id: I.ExportFormat.Markdown, name: 'Markdown' },
			(config.experimental ? { id: I.ExportFormat.Html, name: 'HTML' } : null),
		];

		this.init();

		let options = null;
		if (this.format == I.ExportFormat.Markdown) {
			const items = [
				{ id: 'zip', name: 'Zip archive' },
				{ id: 'nested', name: 'Include linked objects' },
				{ id: 'files', name: 'Include files' },
			];

			options = (
				<React.Fragment>
					{items.map((item: any, i: number) => (
						<div key={i} className="row">
							<div className="name">{item.name}</div>
							<div className="value">
								<Switch className="big" value={this[item.id]} onChange={(e: any, v: boolean) => { this[item.id] = v; }} />
							</div>
						</div>
					))}
				</React.Fragment>
			);
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

				{options}

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
		const options = Storage.get('export');
		if (options) {
			this.format = options.format;
			this.zip = options.zip;
			this.nested = options.nested;
			this.files = options.files;
		};
	};

	save () {
		Storage.set('export', { format: this.format, zip: this.zip, nested: this.nested, files: this.files });
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
		};
		
		this.save();
		close();
	};

	onCancel (e: any) {
		this.props.close();
	};
	
});

export default PopupExport;