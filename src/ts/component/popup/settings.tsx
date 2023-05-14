import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader, IconObject, ObjectName, Icon } from 'Component';
import { I, C, Storage, Util, analytics, Action, keyboard, translate } from 'Lib';
import { popupStore, detailStore, commonStore, blockStore, authStore } from 'Store';
import Constant from 'json/constant.json';

import PageAccount from './page/settings/account';
import PageDelete from './page/settings/delete';
import PagePersonal from './page/settings/personal';
import PageAppearance from './page/settings/appearance';
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
import PageImportCsv from './page/settings/import/csv';

import PageExportIndex from './page/settings/export/index';
import PageExportProtobuf from './page/settings/export/protobuf';
import PageExportMarkdown from './page/settings/export/markdown';

import PageSpaceIndex from './page/settings/space/index';
import PageSpaceInvite from './page/settings/space/invite';
import PageSpaceTeam from './page/settings/space/team';
import PageSpaceLeave from './page/settings/space/leave';
import PageSpaceRemove from './page/settings/space/remove';

interface State {
	loading: boolean;
};

const Components: any = {
	account:			 PageAccount,
	delete:				 PageDelete,
	personal:			 PagePersonal,
	appearance:			 PageAppearance,
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
	importCsv:			 PageImportCsv,

	exportIndex:		 PageExportIndex,
	exportProtobuf:		 PageExportProtobuf,
	exportMarkdown:		 PageExportMarkdown,

	spaceIndex:			 PageSpaceIndex,
	spaceInvite:		 PageSpaceInvite,
	spaceTeam:		 	 PageSpaceTeam,
	spaceLeave:		 	 PageSpaceLeave,
	spaceRemove:		 PageSpaceRemove,
};

const PopupSettings = observer(class PopupSettings extends React.Component<I.Popup, State> {

	node = null;
	ref = null;
	state = {
		loading: false,
	};
	prevPage = '';
	pinConfirmed = false;
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
		const { account } = authStore;
		const sections = this.getSections().filter(it => !it.isHidden);
		const profile = detailStore.get(Constant.subId.profile, blockStore.profile);
		const space = detailStore.get(Constant.subId.space, commonStore.workspace);
		const cnr = [ 'side', 'right', Util.toCamelCase('tab-' + page) ];
		const length = sections.length;

		if (!length) {
			cnr.push('isFull');
		};

		let content = null;

		if (Components[page]) {
			const Component = Components[page];
			content = (
				<Component 
					ref={ref => this.ref = ref}
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

		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}

				<div className="items">
					{item.children.map((action: any, i: number) => {
						let icon = null;
						if (action.id == 'account') {
							icon = <IconObject object={profile} size={22} iconSize={22} forceLetter={true} />;
						} else {
							icon = <Icon className={action.icon || action.id} />;
						};

						return (
							<div 
								key={i} 
								id={`item-${action.id}`} 
								className="item" 
								onClick={() => this.onPage(action.id)}
							>
								{icon}
								<div className="name">{action.name}</div>
							</div>
						);
					})}
				</div>
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="sides"
			>
				{sections.length ? (
					<div id="sideLeft" className="side left">
						{sections.map((item: any, i: number) => (
							<Section key={i} {...item} />
						))}
					</div>
				) : ''}
				<div id="sideRight" className={cnr.join(' ')}>
					{loading ? <Loader id="loader" /> : ''}
					{content}
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { page, isSpace } = data;
		const items = this.getItems();

		this.onPage(page || items[0].id);
		this.rebind();

		keyboard.disableNavigation(true);
	};

	componentDidUpdate () {
		this.resize();
		this.setActive();
	};

	componentWillUnmount () {
		this.unbind();
		keyboard.disableNavigation(false);
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on('resize.settings', () => { this.resize(); });
		win.on('keydown.settings', (e: any) => { this.onKeyDown(e); });
		win.on('mousedown.settings', (e: any) => { this.onMouseDown(e); });
	};

	unbind () {
		$(window).off('resize.settings keydown.settings mousedown.settings');
	};

	getSections (): any[] {
		const { param } = this.props;
		const { data } = param;
		const { isSpace } = data;

		if (isSpace) {
			return [
				{ 
					name: 'Space', isHidden: true, children: [
						{ id: 'spaceIndex', name: 'Space', subPages: [ 'spaceInvite', 'spaceTeam', 'spaceLeave', 'spaceRemove' ] },
					]
				},
			];
		} else {
			return [
				{ 
					name: 'Account & data', children: [
						{ id: 'account', name: 'Profile', subPages: [ 'logout', 'delete' ] },
						{ id: 'phrase', name: translate('popupSettingsPhraseTitle') },
						{ id: 'pinIndex', name: translate('popupSettingsPinTitle'), icon: 'pin', subPages: [ 'pinSelect', 'pinConfirm' ] },
						//{ id: 'cloud', name: 'Cloud storage' },
					] 
				},
				{ 
					name: 'Customization', children: [
						{ id: 'personal', name: translate('popupSettingsPersonalTitle') },
						{ id: 'appearance', name: translate('popupSettingsAppearanceTitle') },
					] 
				},
				{ 
					name: 'Integrations', children: [
						{ id: 'importIndex', name: translate('popupSettingsImportTitle'), icon: 'import', subPages: [ 'importNotion', 'importNotionHelp', 'importNotionWarning', 'importMarkdown' ] },
						{ id: 'exportIndex', name: translate('popupSettingsExportTitle'), icon: 'export', subPages: [ 'exportProtobuf', 'exportMarkdown' ] },
					] 
				}
			];
		};
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
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
		C.ObjectImport(param, [], true, type, I.ImportMode.IgnoreErrors, false, false, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			if (!message.error.code) {
				analytics.event('Import', { middleTime: message.middleTime, type });
			};
		});
	};

	onExport (format: I.ExportType, param: any) {
		const { zip, nested, files, archived } = param || {};

		Action.export([], format, zip, nested, files, archived, () => { this.props.close(); });
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

	setActive () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data || {};
		const node = $(this.node);
		const obj = node.find('#sideLeft');
		const items = this.getItems();

		obj.find('.active').removeClass('active');

		let active = '';
		for (const item of items) {
			if ((item.id == page) || (item.subPages || []).includes(page)) {
				active = item.id;
				break;
			};
		};

		if (active == 'spaceIndex') {
			obj.find('.space').addClass('active');
		} else {
			obj.find(`#item-${active}`).addClass('active');
		};
	};

	resize () {
		const { position } = this.props;

		if (this.ref && this.ref.resize) {
			this.ref.resize();
		};
		
		position();
	};

});

export default PopupSettings;
