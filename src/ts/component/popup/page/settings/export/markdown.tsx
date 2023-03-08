import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, Switch } from 'Component';
import { I, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onExport: (format: I.ExportFormat, param: any) => void;
};

const PopupSettingsPageExportMarkdown = observer(class PopupSettingsPageExportMarkdown extends React.Component<Props> {

	zip = false;
	nested = false;
	files = false;

	render () {
		const { onExport } = this.props;
		const items = [
			{ id: 'zip', name: 'Zip archive', control: 'switch' },
			{ id: 'nested', name: 'Include linked objects', control: 'switch' },
			{ id: 'files', name: 'Include files', control: 'switch' },
		];

		this.init();

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsExportMarkdownTitle')} />

				<div className="labels">
					<Label text={translate('popupSettingsExportMarkdownText1')} />
					<Label text={translate('popupSettingsExportMarkdownText2')} />
				</div>

				<div className="rows">
					{items.map((item: any, i: number) => (
						<div key={i} className="row">
							<div className="side left">
								<Label text={item.name} />
							</div>
							<div className="side right">
								<Switch
									className="big"
									value={this[item.id]}
									onChange={(e: any, v: boolean) => {
										this[item.id] = v;
										this.save();
									}}
								/>
							</div>
						</div>
					))}
				</div>

				<div className="buttons">
					<Button 
						text={translate('popupSettingsExportOk')} 
						className="c36"
						onClick={() => { onExport(I.ExportFormat.Markdown, { zip: this.zip, nested: this.nested, files: this.files }); }} 
					/>
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.init();
	};

	init () {
		const options = Storage.get('popupExport') || {};

		this.zip = Boolean(options.zip);
		this.nested = Boolean(options.nested);
		this.files = Boolean(options.files);
	};

	save () {
		Storage.set('popupExport', { zip: this.zip, nested: this.nested, files: this.files });
	};

});

export default PopupSettingsPageExportMarkdown;