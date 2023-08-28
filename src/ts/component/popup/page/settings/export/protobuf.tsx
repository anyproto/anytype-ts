import * as React from 'react';
import { Title, Label, Button, Switch, Select } from 'Component';
import { I, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

const PopupSettingsPageExportProtobuf = observer(class PopupSettingsPageExportProtobuf extends React.Component<I.PopupSettings> {

	data: any = {};

	render () {
		const { onExport } = this.props;
		const items = [
			{ id: 'zip', name: translate('popupExportZipArchive'), control: 'switch' },
			{ id: 'files', name: translate('popupExportIncludeFiles'), control: 'switch' },
			{ id: 'archived', name: translate('popupExportIncludeArchivedObjects'), control: 'switch' },
		];
		const formatOptios = [
			{ id: 'json', name: 'JSON' },
			{ id: 'pb', name: 'Protobuf' },
		];

		this.init();

		return (
			<React.Fragment>
				<Head {...this.props} returnTo="exportIndex" name={translate('commonBack')} />

				<Title text={translate('popupSettingsExportProtobufTitle')} />

				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsExportProtobufFormat')} />

						<Select 
							id="file-format"
							value={this.data.json ? 'json' : ''}
							options={formatOptios}
							onChange={(v: string) => {
								this.data.json = v == 'json';
								this.save();
							}}
						/>
					</div>

					{items.map((item: any, i: number) => (
						<div key={i} className="item">
							<Label text={item.name} />

							<Switch
								className="big"
								value={this.data[item.id]}
								onChange={(e: any, v: boolean) => {
									this.data[item.id] = v;
									this.save();
								}}
							/>
						</div>
					))}
				</div>

				<div className="buttons">
					<Button 
						text={translate('popupSettingsExportOk')} 
						className="c36"
						onClick={() => onExport(I.ExportType.Protobuf, this.data)} 
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
