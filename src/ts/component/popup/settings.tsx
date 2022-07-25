import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Loader } from 'ts/component';
import { I, C, Storage, Util, analytics, Action } from 'ts/lib';
import { blockStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

import PageIndex from './page/settings/index';
import PageAccount from './page/settings/account';
import PageDelete from './page/settings/delete';
import PagePersonal from './page/settings/personal';
import PageAppearance from './page/settings/appearance';
import PageWallpaper from './page/settings/wallpaper';
import PagePhrase from './page/settings/phrase';
import PageLogout from './page/settings/logout';

import PagePinIndex from './page/settings/pin/index';
import PagePinSelect from './page/settings/pin/select';
import PagePinConfirm from './page/settings/pin/confirm';

import PageImportIndex from './page/settings/import/index';
import PageImportNotion from './page/settings/import/notion';

import PageExportMarkdown from './page/settings/export/markdown';

interface Props extends I.Popup, RouteComponentProps<any> {};

interface State {
	loading: boolean;
};

const $ = require('jquery');

const Components: any = {
	index:				 PageIndex,
	account:			 PageAccount,
	delete:				 PageDelete,
	personal:			 PagePersonal,
	appearance:			 PageAppearance,
	wallpaper:			 PageWallpaper,
	phrase:				 PagePhrase,
	logout:				 PageLogout,

	pinIndex:			 PagePinIndex,
	pinSelect:			 PagePinSelect,
	pinConfirm:			 PagePinConfirm,

	importIndex:		 PageImportIndex,
	importNotion:		 PageImportNotion,

	exportMarkdown:		 PageExportMarkdown,
};

const PopupSettings = observer(class PopupSettings extends React.Component<Props, State> {

	refPhrase: any = null;
	state = {
		loading: false,
	};
	prevPage: string = '';
	pinConfirmed: boolean = false;
	onConfirmPin: any = null;

	constructor (props: any) {
		super(props);

		this.onPage = this.onPage.bind(this);
		this.onExport = this.onExport.bind(this);
		this.onImport = this.onImport.bind(this);
		this.setConfirmPin = this.setConfirmPin.bind(this);
		this.setPinConfirmed = this.setPinConfirmed.bind(this);
		this.setLoading = this.setLoading.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;
		const { loading } = this.state;

		let content = null;

		if (Components[page]) {
			const Component = Components[page];
			content = (
				<Component 
					{...this.props} 
					onPage={this.onPage} 
					onExport={this.onExport} 
					onImport={this.onImport}
					onConfirmPin={this.onConfirmPin}
					setConfirmPin={this.setConfirmPin}
					setPinConfirmed={this.setPinConfirmed}
					setLoading={this.setLoading}
				/>
			);
		};

		return (
			<div className={[ 'tab', Util.toCamelCase('tab-' + page) ].join(' ')}>
				{loading ? <Loader id="loader" /> : ''}
				{content}
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;

		this.onPage(page || 'index');
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};

	componentWillUnmount () {
		$(window).off('resize.settings');
	};

	setConfirmPin (v: () => void) {
		this.onConfirmPin = v;
		this.forceUpdate();
	};

	setPinConfirmed (v: boolean) {
		this.pinConfirmed = v;
	};

	setLoading (v: boolean) {
		this.setState({ loading: v });
	};

	onPage (id: string) {
		const { param } = this.props;
		const { data } = param;
		const { page } = data || {};
		const pin = Storage.get('pin');

		if (pin && (id == 'phrase') && !this.pinConfirmed) {
			this.setConfirmPin(() => { 
				this.setPinConfirmed(true);
				this.onPage('phrase');
				this.setPinConfirmed(false);
			});
			this.onPage('pinConfirm');
			return;
		};

		this.prevPage = page;
		popupStore.updateData(this.props.id, { page: id });

		analytics.event('settings', { params: { id } });
	};

	onImport (format: I.ImportFormat) {
		const platform = Util.getPlatform();
		const { close } = this.props;
		const { root } = blockStore;
		const options: any = { 
			properties: [ 'openFile' ],
			filters: [
				{ name: '', extensions: [ 'zip' ] }
			]
		};

		if (platform == I.Platform.Mac) {
			options.properties.push('openDirectory');
		};

		window.Electron.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			close();
			C.ObjectImportMarkdown(root, files[0], (message: any) => {
				analytics.event('ImportFromNotion', { middleTime: message.middleTime });
			});
		});
	};

	onExport (format: I.ExportFormat) {
		Action.export([], format, true, true, true, () => { this.props.close(); });
	};

	init () {
		this.props.position();
		$(window).off('resize.settings').on('resize.settings', () => { this.props.position(); });
	};

});

export default PopupSettings;
