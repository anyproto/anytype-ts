import * as React from 'react';
import { Title, Label, Button, Icon, Select, Switch, Error } from 'Component';
import { I, S, U, translate, keyboard, Action } from 'Lib';

interface State {
	error: string;
};

class PageMainSettingsImportCsv extends React.Component<I.PageSettingsComponent, State> {

	refMode = null;
	refDelimiter = null;
	data: any = {};
	state: State = { 
		error: '',
	};

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onImport = this.onImport.bind(this);
		this.onFilterKeyUp = this.onFilterKeyUp.bind(this);
	};

	render () {
		this.init();

		const { config } = S.Common;
		const { error } = this.state;
		const { delimiter, delimiters } = this.delimiterOptions();

		const modeOptions: any[] = [ 
			{ id: I.CsvImportMode.Collection, name: translate('popupSettingsImportCsvCollection') },
		];

		if (config.experimental) {
			modeOptions.unshift({ id: I.CsvImportMode.Table, name: translate('popupSettingsImportCsvTable') });
		};

		return (
			<div>
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

			S.Menu.close('select');
		});
	};

	delimiterSet (id: string, v: string) {
		const delimiters = this.getDelimiters();
		const option = delimiters.find(it => {
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
		const delimiters = this.getDelimiters();

		let delimiter = delimiters.find(it => (it.value == this.data.delimiter) || (it.caption == this.data.delimiter));
		if (!delimiter) {
			delimiter = { id: 'custom', name: translate('popupSettingsImportCsvCustom'), caption: this.data.delimiter };
			delimiters.push(delimiter);
		};

		return { delimiter, delimiters };
	};

	onImport () {
		Action.import(I.ImportType.Csv, [ 'csv', 'zip' ], this.data, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			U.Space.openDashboard();
		});
	};

	save () {
		this.props.storageSet({ csv: this.data });
	};

	getDelimiters () {
		return [
			{ id: 'comma', name: translate('delimiterComma'), caption: ',' },
			{ id: 'semicolon', name: translate('delimiterSemicolon'), caption: ';' },
			{ id: 'space', name: translate('delimiterSpace'), caption: '_', value: ' ' },
			{ id: 'tab', name: translate('delimiterTab'), caption: '\\t', value: '\t' },
			{ id: 'pipe', name: translate('delimiterPipe'), caption: '|' },
		];
	};

};

export default PageMainSettingsImportCsv;
