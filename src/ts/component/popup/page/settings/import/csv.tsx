import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button, Icon, Select, Switch } from 'Component';
import { I, Util, translate, keyboard } from 'Lib';
import { menuStore } from 'Store';
import Head from '../head';

interface Props extends I.Popup, RouteComponentProps<any> {
	prevPage: string;
	onPage: (id: string) => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

const Delimiters: any[] = [
	{ id: 'comma', name: 'Comma', caption: ',' },
	{ id: 'semicolon', name: 'Semicolon', caption: ';' },
	{ id: 'space', name: 'Space', caption: '_', value: ' ' },
	{ id: 'tab', name: 'Tab', caption: '\\t', value: '\t' },
	{ id: 'pipe', name: 'Pipe', caption: '|' },
];

class PopupSettingsPageImportCsv extends React.Component<Props> {

	mode: I.CsvImportMode = I.CsvImportMode.Table;
	header = false;
	transpose = false;
	delimiter = ',';
	refDelimiter = null;

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
		this.onFilterKeyUp = this.onFilterKeyUp.bind(this);
	};

	render () {
		const modeOptions = [ 
			{ id: I.CsvImportMode.Table, name: 'Table' },
			{ id: I.CsvImportMode.Collection, name: 'Collection' },
		].map(it => ({ ...it, id: String(it.id) }));
		const { delimiter, delimiters } = this.delimiterOptions();

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
							menuParam={{ horizontal: I.MenuDirection.Right }}
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
						<Select 
							ref={ref => this.refDelimiter = ref}
							id="csv-import-delimiter" 
							value={delimiter?.id} 
							options={delimiters} 
							onChange={v => this.delimiterSet(v, '')}
							arrowClassName="light"
							menuParam={{ 
								horizontal: I.MenuDirection.Right, 
								data: { 
									withFilter: true,
									preventFilter: true,
									placeholder: 'Custom symbol',
									onFilterKeyUp: this.onFilterKeyUp,
								},
							}}
						/>

					</div>
				</div>
				
				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsImportOk')} onClick={this.onImport} />
				</div>
			</div>
		);
	};

	onFilterKeyUp (e: React.KeyboardEvent, v: string) {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.delimiterSet('', v);
			this.forceUpdate();

			const { delimiter, delimiters } = this.delimiterOptions();

			this.refDelimiter.setOptions(delimiters);
			this.refDelimiter.setValue(delimiter?.id);

			menuStore.close('select');
		});
	};

	delimiterSet (id: string, v: string) {
		const option = Delimiters.find(it => {
			if (id && (it.id == id)) {
				return true;
			};
			if (v && ((it.value == v) || (it.caption == v))) {
				return true;
			};
			return false;
		});

		if (option) {
			this.delimiter = option.value || option.caption;
		} else 
		if (v) {
			this.delimiter = v.substring(0, 10);
		};
	};

	delimiterOptions () {
		const delimiters = Util.objectCopy(Delimiters);

		let delimiter = delimiters.find(it => (it.value == this.delimiter) || (it.caption == this.delimiter));
		if (!delimiter) {
			delimiter = { id: 'custom', name: 'Custom', caption: this.delimiter };
			delimiters.push(delimiter);
		};

		return { delimiter, delimiters };
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