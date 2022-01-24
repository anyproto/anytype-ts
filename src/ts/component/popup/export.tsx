import * as React from 'react';
import { I, Action } from 'ts/lib';
import { Title, Select, Button, Switch } from 'ts/component';
import { observer } from 'mobx-react';

interface Props extends I.Popup {};

const PopupExport = observer(class PopupExport extends React.Component<Props, {}> {

	format: I.ExportFormat = I.ExportFormat.Markdown;
	zip: boolean = false;
	nested: boolean = false;
	files: boolean = false;

	constructor(props: any) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};

	render() {
		const options = [
			{ id: I.ExportFormat.Markdown, name: 'Markdown' },
		];
		
		return (
			<React.Fragment>
				<Title text="Export" />

				<div className="row">
					<div className="name">Export format</div>
					<div className="value">
						<Select id="format" value={this.format} options={options} onChange={(v: any) => { this.format = v; }} />
					</div>
				</div>
				<div className="row">
					<div className="name">Zip archive</div>
					<div className="value">
						<Switch value={this.zip} onChange={(e: any, v: boolean) => { this.zip = v; }} />
					</div>
				</div>
				<div className="row">
					<div className="name">Include subpages</div>
					<div className="value">
						<Switch value={this.nested} onChange={(e: any, v: boolean) => { this.nested = v; }} />
					</div>
				</div>
				<div className="row">
					<div className="name">Include files</div>
					<div className="value">
						<Switch value={this.files} onChange={(e: any, v: boolean) => { this.files = v; }} />
					</div>
				</div>
				<div className="buttons">
					<Button color="orange" text="Export" onClick={this.onConfirm} />
					<Button color="blank" text="Cancel" onClick={this.onCancel} />
				</div>
			</React.Fragment>
		);
	};

	onConfirm (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;

		Action.export([ rootId ], this.format, this.zip, this.nested, this.files);
		close();
	};

	onCancel (e: any) {
		this.props.close();
	};
	
});

export default PopupExport;