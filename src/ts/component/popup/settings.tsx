import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Loader } from 'Component';
import { I, C, Storage, Util, analytics, Action, keyboard } from 'Lib';
import { popupStore } from 'Store';

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
import PageImportNotionHelp from './page/settings/import/notion/help';
import PageImportNotionWarning from './page/settings/import/notion/warning';
import PageImportMarkdown from './page/settings/import/markdown';

import PageExportMarkdown from './page/settings/export/markdown';

interface State {
	loading: boolean;
};


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
	importNotionHelp:	 PageImportNotionHelp,
	importNotionWarning: PageImportNotionWarning,
	importMarkdown:		 PageImportMarkdown,

	exportMarkdown:		 PageExportMarkdown,
};

const PopupSettings = observer(class PopupSettings extends React.Component<I.Popup, State> {

	refPhrase: any = null;
	state = {
		loading: false,
	};
	prevPage: string = '';
	pinConfirmed: boolean = false;
	onConfirmPin: any = null;

	constructor (props: I.Popup) {
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
					prevPage={this.prevPage}
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
		this.rebind();

		keyboard.disableNavigation(true);
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount () {
		$(window).off('resize.settings');
		this.unbind();
		keyboard.disableNavigation(false);
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on('resize.settings', () => { this.props.position(); });
		win.on('keydown.settings', (e: any) => { this.onKeyDown(e); });
		win.on('mousedown.settings', (e: any) => { this.onMouseDown(e); });
	};

	unbind () {
		$(window).off('resize.settings keydown.settings mousedown.settings');
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

		this.prevPage = page;

		if (pin && (id == 'phrase') && !this.pinConfirmed) {
			this.setConfirmPin(() => { 
				this.setPinConfirmed(true);
				this.onPage('phrase');
				this.setPinConfirmed(false);
			});

			this.onPage('pinConfirm');
			return;
		};

		popupStore.updateData(this.props.id, { page: id });
		analytics.event('settings', { params: { id } });
	};

	onImport (type: I.ImportType, param: any, callBack?: (message: any) => void) {
		C.ObjectImport(param, [], true, type, I.ImportMode.IgnoreErrors, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			if (!message.error.code) {
				analytics.event('Import', { middleTime: message.middleTime, type });
			};
		});
	};

	onExport (format: I.ExportFormat, param: any) {
		const { zip, nested, files } = param;

		Action.export([], format, zip, nested, files, () => { this.props.close(); });
	};

	onKeyDown (e: any) {
		const platform = Util.getPlatform();
		const isMac = platform == I.Platform.Mac;

		keyboard.shortcut(isMac ? 'cmd+[' : 'alt+arrowleft', e, (pressed: string) => { this.onBack(); });
	};

	onMouseDown (e: any) {
		// Mouse back
		if (e.buttons & 8) {
			e.preventDefault();
			this.onBack();
		};
	};

	onBack () {
		this.prevPage ? this.onPage(this.prevPage) : this.props.close();
	};

});

export default PopupSettings;
