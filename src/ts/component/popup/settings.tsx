import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Loader, IconObject, Icon, Label } from 'Component';
import { I, UtilCommon, UtilObject, analytics, Action, keyboard, translate, Preview } from 'Lib';
import { popupStore } from 'Store';

import PageAccount from './page/settings/account';
import PageDataManagement from './page/settings/data';
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
import PageImportCsv from './page/settings/import/csv';

import PageExportIndex from './page/settings/export/index';
import PageExportProtobuf from './page/settings/export/protobuf';
import PageExportMarkdown from './page/settings/export/markdown';

import PageSpaceIndex from './page/settings/space/index';
import PageSpaceCreate from './page/settings/space/create';
import PageSpaceStorageManager from './page/settings/space/storage';
import PageSpaceShare from './page/settings/space/share';
import PageSpaceMembers from './page/settings/space/members';
import PageSpaceList from './page/settings/space/list';

interface State {
	loading: boolean;
};

const Components: any = {
	account:			 PageAccount,
	dataManagement: 	 PageDataManagement,
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
	importCsv:			 PageImportCsv,

	exportIndex:		 PageExportIndex,
	exportProtobuf:		 PageExportProtobuf,
	exportMarkdown:		 PageExportMarkdown,

	spaceIndex:			 PageSpaceIndex,
	spaceCreate:		 PageSpaceCreate,
	spaceStorageManager: PageSpaceStorageManager,
	spaceShare:			 PageSpaceShare,
	spaceMembers:		 PageSpaceMembers,
	spaceList:			 PageSpaceList,
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
		this.setConfirmPin = this.setConfirmPin.bind(this);
		this.setPinConfirmed = this.setPinConfirmed.bind(this);
		this.setLoading = this.setLoading.bind(this);
		this.onSpaceTypeTooltip = this.onSpaceTypeTooltip.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { page } = data;
		const { loading } = this.state;
		const sections = this.getSections().filter(it => !it.isHidden);
		const participant = UtilObject.getParticipant();
		const cnr = [ 'side', 'right', UtilCommon.toCamelCase('tab-' + page) ];
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
					onConfirmPin={this.onConfirmPin}
					setConfirmPin={this.setConfirmPin}
					setPinConfirmed={this.setPinConfirmed}
					setLoading={this.setLoading}
					onSpaceTypeTooltip={this.onSpaceTypeTooltip}
				/>
			);

			if (this.isSubPage(page)) {
				cnr.push('isSubPage');
			};
		};

		const Item = (action: any) => {
			const cn = [ 'item' ];

			let icon = null;
			let name = null;

			if (action.id == 'account') {
				icon = <IconObject object={participant} size={36} iconSize={36} forceLetter={true} />;
				name = participant.name;

				cn.push('itemAccount');
			} else {
				icon = <Icon className={`settings-${action.icon || action.id}`} />;
				name = action.name;
			};

			return (
				<div
					id={`item-${action.id}`}
					className={cn.join(' ')}
					onClick={() => this.onPage(action.id)}
				>
					{icon}
					<div className="name">{name}</div>
				</div>
			);
		};

		const Section = (item: any) => (
			<div className={[ 'section', String(item.id || '') ].join(' ')}>
				{item.name ? <div className="name">{item.name}</div> : ''}

				<div className="items">
					{item.children.map((action: any, i: number) => (
						<Item key={i} {...action} />
					))}
				</div>
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="mainSides"
			>
				{sections.length ? (
					<div id="sideLeft" className="side left">
						<div className="sections">
							{sections.map((item: any, i: number) => (
								<Section key={i} {...item} />
							))}
						</div>

						<div className="section" onClick={e => this.onPage('logout')}>
							<div className="items">
								<div className="item">
									<Icon className="logout" />
									<Label text={translate('popupSettingsLogout')} />
								</div>
							</div>
						</div>
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
		const { page } = data;
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
		win.on('resize.settings', () => this.resize());
		win.on('keydown.settings', e => this.onKeyDown(e));
		win.on('mousedown.settings', e => this.onMouseDown(e));
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
					name: translate('popupSettingsSpaceTitle'), isHidden: true, children: [
						{
							id: 'spaceIndex',
							name: translate('popupSettingsSpaceTitle'),
							subPages: [
								'spaceCreate', 'spaceStorageManager',
								'importIndex', 'importNotion', 'importNotionHelp', 'importNotionWarning', 'importCsv',
								'exportIndex', 'exportProtobuf', 'exportMarkdown',
								'spaceShare', 'spaceMembers'
							],
							noHeader: [ 'spaceCreate' ],
						},
					]
				},
			];
		} else {
			return [
				{ id: 'account', children: [ { id: 'account', name: translate('popupSettingsProfileTitle') } ] },
				{
					name: translate('popupSettingsApplicationTitle'), children: [
						{ id: 'personal', name: translate('popupSettingsPersonalTitle') },
						{ id: 'appearance', name: translate('popupSettingsAppearanceTitle') },
						{ id: 'pinIndex', name: translate('popupSettingsPinTitle'), icon: 'pin', subPages: [ 'pinSelect', 'pinConfirm' ] },
					]
				},
				{ 
					name: translate('popupSettingsVoidTitle'), children: [
						{ id: 'spaceList', name: translate('popupSettingsSpacesListTitle'), icon: 'spaces' },
						{ id: 'dataManagement', name: translate('popupSettingsDataManagementTitle'), icon: 'storage', subPages: [ 'delete' ] },
						{ id: 'phrase', name: translate('popupSettingsPhraseTitle') },
					]
				}
			];
		};
	};

	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
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

		this.prevPage = page;

		popupStore.updateData(this.props.id, { page: id });
		analytics.event('settings', { params: { id } });
	};

	onExport (type: I.ExportType, param: any) {
		analytics.event('ClickExport', { type, route: 'Settings' });
		Action.export([], type, { ...param, route: 'Settings' }, () => this.props.close());
	};

	onKeyDown (e: any) {
		keyboard.shortcut(UtilCommon.isPlatformMac() ? 'cmd+[' : 'alt+arrowleft', e, () => this.onBack());
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

	isSubPage (page) {
		const items = this.getItems();

		for (const item of items) {
			if ((item.subPages || []).includes(page) && !(item.noHeader || []).includes(page)) {
				return true;
			};
		};

		return false;
	};

	onSpaceTypeTooltip (e) {
		Preview.tooltipShow({
			title: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipTitle'),
			text: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipText'),
			className: 'big',
			element: $(e.currentTarget),
			typeY: I.MenuDirection.Bottom,
			typeX: I.MenuDirection.Left
		});
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
