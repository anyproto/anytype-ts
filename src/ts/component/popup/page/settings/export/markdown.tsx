import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, Switch } from 'Component';
import { I, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';

import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onExport: (format: I.ExportFormat, param: any) => void;
};

const PopupSettingsPageExportMarkdown = observer(class PopupSettingsPageExportMarkdown extends React.Component<Props, {}> {

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
			<div>
				<Head {...this.props} returnTo="index" name={translate('popupSettingsTitle')} />

				<Title text={translate('popupSettingsExportMarkdownTitle')} />
				<Label text={translate('popupSettingsExportMarkdownText')} />

				{items.map((item: any, i: number) => (
					<div key={i} className="row flex">
						<div className="side left">
							<Label text={item.name} />
						</div>
						<div className="side right">
							<Switch
								className="big"
								value={this[item.id]}
								onChange={(e: any, v: boolean) => {
									this[item.id] = v;
								}}
							/>
						</div>
					</div>
				))}

				<Button 
					text={translate('popupSettingsExportOk')} 
					onClick={() => { onExport(I.ExportFormat.Markdown, { zip: this.zip, nested: this.nested, files: this.files }); }} 
				/>
			</div>
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

});

export default PopupSettingsPageExportMarkdown;