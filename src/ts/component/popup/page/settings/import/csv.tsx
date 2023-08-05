import * as React from 'react';
import { Title, Label, Button, Icon, Select, Switch, Error } from 'Component';
import { I, UtilCommon, translate, keyboard, analytics } from 'Lib';
import { menuStore } from 'Store';
import Head from '../head';

interface Props extends I.PopupSettings {
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
};

interface State {
	error: string;
};

const Delimiters: any[] = [
	{ id: 'comma', name: 'Comma', caption: ',' },
	{ id: 'semicolon', name: 'Semicolon', caption: ';' },
	{ id: 'space', name: 'Space', caption: '_', value: ' ' },
	{ id: 'tab', name: 'Tab', caption: '\\t', value: '\t' },
	{ id: 'pipe', name: 'Pipe', caption: '|' },
];

class PopupSettingsPageImportCsv extends React.Component<Props, State> {

	refMode = null;
	refDelimiter = null;
	data: any = {};
	state: State = { 
		error: '',
	};

	constructor (props: Props) {
		super(props);

		this.onImport = this.onImport.bind(this);
		this.onFilterKeyUp = this.onFilterKeyUp.bind(this);
	};

	render () {
		this.init();

		const { error } = this.state;
		const modeOptions = [ 
			{ id: I.CsvImportMode.Table, name: translate('popupSettingsImportCsvTable') },
			{ id: I.CsvImportMode.Collection, name: translate('popupSettingsImportCsvCollection') },
		].map(it => ({ ...it, id: String(it.id) }));
		const { delimiter, delimiters } = this.delimiterOptions();

		return (
			<div>
				<Head {...this.props} returnTo="importIndex" name={translate('popupSettingsImportTitle')} />

				<Icon className="logo" />
				<Title text={translate('popupSettingsImportCsvTitle')} />
				<Label text={translate('popupSettingsImportCsvText')} />

				<div className="actionItems">
					<div className="item">
						<Label text={translate('popupSettingsImportCsvMode')} />
						<Select 
							ref={ref => this.refMode = ref}
							id="csv-import-mode" 
							value={String(this.data.mode)} 
							options={modeOptions} 
							onChange={v => {
								this.data.mode = Number(v) || 0;
								this.save();
							}}
							arrowClassName="light"
							menuParam={{ horizontal: I.MenuDirection.Right }}
						/>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsImportCsvUseFirstRow')} />
						<Switch 
							value={this.data.firstRow} 
							className="big" 
							onChange={(e: any, v: boolean) => { 
								this.data.firstRow = v; 
								this.save();
							}}
						/>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsImportCsvTranspose')} />
						<Switch 
							value={this.data.transpose} 
							className="big" 
							onChange={(e: any, v: boolean) => { 
								this.data.transpose = v; 
								this.save();
							}}
						/>
					</div>

					<div className="item">
						<Label text={translate('popupSettingsImportCsvColumnsDivider')} />
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
									placeholder: translate('popupSettingsImportCsvCustomSymbol'),
									onFilterKeyUp: this.onFilterKeyUp,
								},
							}}
						/>

					</div>
				</div>
				
				<div className="buttons">
					<Button className="c36" text={translate('popupSettingsImportOk')} onClick={this.onImport} />
				</div>

				<Error text={error} />
			</div>
		);
	};

	componentDidMount(): void {
		this.init();
	};

	init () {
		const { storageGet } = this.props;
		const options = storageGet().csv || {};

		if (undefined === options.firstRow) {
			options.firstRow = true;
		};

		this.data = {
			mode: Number(options.mode) || I.CsvImportMode.Collection,
			firstRow: Boolean(options.firstRow),
			transpose: Boolean(options.transpose),
			delimiter: String(options.delimiter || ','),
		};
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
			this.data.delimiter = option.value || option.caption;
		} else 
		if (v) {
			this.data.delimiter = v.substring(0, 10);
		};

		this.save();
	};

	delimiterOptions () {
		const delimiters = UtilCommon.objectCopy(Delimiters);

		let delimiter = delimiters.find(it => (it.value == this.data.delimiter) || (it.caption == this.data.delimiter));
		if (!delimiter) {
			delimiter = { id: 'custom', name: translate('popupSettingsImportCsvCustom'), caption: this.data.delimiter };
			delimiters.push(delimiter);
		};

		return { delimiter, delimiters };
	};

	onImport () {
		const { close, onImport } = this.props;
		const options: any = { 
			properties: [ 'openFile' ],
			filters: [
				{ name: 'ZIP & CSV', extensions: [ 'csv', 'zip' ] }
			]
		};

		if (UtilCommon.isPlatformMac()) {
			options.properties.push('openDirectory');
		};

		analytics.event('ClickImport', { type: I.ImportType.Csv });

		window.Electron.showOpenDialog(options).then((result: any) => {
			const paths = result.filePaths;
			if ((paths == undefined) || !paths.length) {
				return;
			};

			onImport(I.ImportType.Csv, { paths, ...this.data }, (message: any) => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
					return;
				};

				close();
			});
		});
	};

	save () {
		const { storageSet } = this.props;

		storageSet({ csv: this.data });
	};

};

export default PopupSettingsPageImportCsv;
