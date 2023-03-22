import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, Icon, Select, Switch, Input } from 'Component';
import { I, Util, translate } from 'Lib';
import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

class PopupSettingsPageImportCsv extends React.Component<Props> {

	mode: I.CsvImportMode = I.CsvImportMode.Table;
	header = false;
	transpose = false;
	delimiter = ',';

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
	};

	render () {
		const modeOptions = [ 
			{ id: I.CsvImportMode.Table, name: 'Table' },
			{ id: I.CsvImportMode.Collection, name: 'Collection' },
		].map(it => ({ ...it, id: String(it.id) }));

		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />

				<Icon className="logo" />
				<Title text={translate('popupSettingsImportCsvTitle')} />
				<Label text={translate('popupSettingsImportCsvText')} />

				<div className="rows">
					<div className="row">
						<Label text="Mode" />
						<Select 
							id="csv-import-mode" 
							value={this.mode} 
							options={modeOptions} 
							onChange={v => this.mode = Number(v)}
							arrowClassName="light"
						/>
					</div>

					<div className="row">
						<Label text="Use the first row as column names" />
						<Switch value={this.header} className="big" onChange={(e: any, v: boolean) => { this.header = v; }}/>
					</div>

					<div className="row">
						<Label text="Transpose rows and columns" />
						<Switch value={this.transpose} className="big" onChange={(e: any, v: boolean) => { this.transpose = v; }}/>
					</div>

					<div className="row">
						<Label text="Columns are divided by" />
						<Input value={this.delimiter} className="short" onKeyUp={(e: any, v: string) => { this.delimiter = v; }} maxLength={10} />
					</div>
				</div>
				
				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsImportOk')} onClick={this.onImport} />
				</div>
			</div>
		);
	};

	onImport () {
		const { close, onImport } = this.props;
		const platform = Util.getPlatform();
		const options: any = { 
			properties: [ 'openFile' ],
			filters: [
				{ name: '', extensions: [ 'csv' ] }
			]
		};

		if (platform == I.Platform.Mac) {
			options.properties.push('openDirectory');
		};

		window.Electron.showOpenDialog(options).then((result: any) => {
			const paths = result.filePaths;
			if ((paths == undefined) || !paths.length) {
				return;
			};

			close();
			onImport(I.ImportType.Csv, { 
				paths, 
				mode: this.mode, 
				useFirstColumnForRelations: this.header,
				transpose: this.transpose,
				delimiter: this.delimiter,
			});
		});
	};

};

export default PopupSettingsPageImportCsv;