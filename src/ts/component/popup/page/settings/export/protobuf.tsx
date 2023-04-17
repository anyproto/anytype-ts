import * as React from 'react';
import { Title, Label, Button, Switch } from 'Component';
import { I, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

const PopupSettingsPageExportProtobuf = observer(class PopupSettingsPageExportProtobuf extends React.Component<I.PopupSettings> {

	data: any = {};

	render () {
		const { onExport } = this.props;
		const items = [
			{ id: 'zip', name: 'Zip archive', control: 'switch' },
			{ id: 'nested', name: 'Include linked objects', control: 'switch' },
			{ id: 'files', name: 'Include files', control: 'switch' },
			{ id: 'archived', name: 'Include archived objects', control: 'switch' },
		];

		this.init();

		return (
			<React.Fragment>
				<Head {...this.props} returnTo="exportIndex" name={translate('commonBack')} />

				<Title text={translate('popupSettingsExportProtobufTitle')} />

				<div className="rows">
					{items.map((item: any, i: number) => (
						<div key={i} className="row">
							<div className="side left">
								<Label text={item.name} />
							</div>
							<div className="side right">
								<Switch
									className="big"
									value={this.data[item.id]}
									onChange={(e: any, v: boolean) => {
										this.data[item.id] = v;
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
						onClick={() => { onExport(I.ExportType.Protobuf, this.data); }} 
					/>
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		this.init();
	};

	init () {
		this.data = Storage.get('popupExport') || {};
	};

	save () {
		Storage.set('popupExport', this.data);
	};

});

export default PopupSettingsPageExportProtobuf;