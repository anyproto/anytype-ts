import React, { forwardRef, useState, useRef, useEffect, KeyboardEvent } from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon, Select, Switch, Error } from 'Component';
import { I, S, U, J, translate, keyboard, Action } from 'Lib';

const PageMainSettingsImportCsv = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { storageGet, storageSet } = props;
	const [ error, setError ] = useState('');
	const [ data, setData ] = useState<any>({});
	const delimiterRef = useRef(null);

	const init = () => {
		const options = storageGet().csv || {};

		if (undefined === options.firstRow) {
			options.firstRow = true;
		};

		setData({
			mode: Number(options.mode) || I.CsvImportMode.Collection,
			firstRow: Boolean(options.firstRow),
			transpose: Boolean(options.transpose),
			delimiter: String(options.delimiter || ','),
		});
	};

	const onFilterKeyUp = (e: KeyboardEvent, v: string) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			delimiterSet('', v);
			S.Menu.close('select');
		});
	};

	const delimiterSet = (id: string, v: string) => {
		const delimiters = getDelimiters();
		const option = delimiters.find(it => {
			if (id && (it.id == id)) {
				return true;
			};
			if (v && ((it.value == v) || (it.caption == v))) {
				return true;
			};
			return false;
		});

		let delimiter = '';
		if (option) {
			delimiter = option.value || option.caption;
		} else 
		if (v) {
			delimiter = v.substring(0, 10);
		};

		save({ ...data, delimiter });
	};

	const delimiterOptions = () => {
		const delimiters = getDelimiters();

		let delimiter = delimiters.find(it => (it.value == data.delimiter) || (it.caption == data.delimiter));
		if (!delimiter) {
			delimiter = { id: 'custom', name: translate('popupSettingsImportCsvCustom'), caption: data.delimiter };
			delimiters.push(delimiter);
		};

		return { delimiter, delimiters };
	};

	const onImport = () => {
		Action.import(I.ImportType.Csv, J.Constant.fileExtension.import[I.ImportType.Csv], data, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
			} else {
				U.Space.openDashboard();
			};
		});
	};

	const save = (newData) => {
		setData(newData);
		storageSet({ csv: newData });
	};

	const getDelimiters = () => {
		return [
			{ id: 'comma', name: translate('delimiterComma'), caption: ',' },
			{ id: 'semicolon', name: translate('delimiterSemicolon'), caption: ';' },
			{ id: 'space', name: translate('delimiterSpace'), caption: '_', value: ' ' },
			{ id: 'tab', name: translate('delimiterTab'), caption: '\\t', value: '\t' },
			{ id: 'pipe', name: translate('delimiterPipe'), caption: '|' },
		];
	};

	const { delimiter, delimiters } = delimiterOptions();
	const modeOptions: any[] = [ 
		{ id: I.CsvImportMode.Collection, name: translate('popupSettingsImportCsvCollection') },
		{ id: I.CsvImportMode.Table, name: translate('popupSettingsImportCsvTable') }
	];

	useEffect(() => {
		init();
	}, []);

	useEffect(() => {
		const { delimiter, delimiters } = delimiterOptions();

		delimiterRef.current?.setOptions(delimiters);
		delimiterRef.current?.setValue(delimiter?.id);
	}, [ data ]);

	return (
		<div>
			<Icon className="logo" />
			<Title text={translate('popupSettingsImportCsvTitle')} />
			<Label text={translate('popupSettingsImportCsvText')} />

			<div className="actionItems">
				<div className="item">
					<Label text={translate('popupSettingsImportCsvMode')} />
					<Select 
						id="csv-import-mode" 
						value={String(data.mode)} 
						options={modeOptions} 
						onChange={(v: string) => save({ ...data, mode: Number(v) || 0 })}
						arrowClassName="light"
						menuParam={{ horizontal: I.MenuDirection.Right }}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsImportCsvUseFirstRow')} />
					<Switch 
						value={data.firstRow} 
						className="big" 
						onChange={(e: any, v: boolean) => save({ ...data, firstRow: v })}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsImportCsvTranspose')} />
					<Switch 
						value={data.transpose} 
						className="big" 
						onChange={(e: any, v: boolean) => save({ ...data, transpose: v })}
					/>
				</div>

				<div className="item">
					<Label text={translate('popupSettingsImportCsvColumnsDivider')} />
					<Select 
						ref={delimiterRef}
						id="csv-import-delimiter" 
						value={delimiter?.id} 
						options={delimiters} 
						onChange={v => delimiterSet(v, '')}
						arrowClassName="light"
						menuParam={{ 
							horizontal: I.MenuDirection.Right, 
							data: {
								withFilter: true,
								preventFilter: true,
								placeholder: translate('popupSettingsImportCsvCustomSymbol'),
								onFilterKeyUp: onFilterKeyUp,
							},
						}}
					/>

				</div>
			</div>
			
			<div className="buttons">
				<Button className="c36" text={translate('popupSettingsImportData')} onClick={onImport} />
			</div>

			<Error text={error} />
		</div>
	);

}));

export default PageMainSettingsImportCsv;