import * as React from 'react';
import $ from 'jquery';
import { Header, Footer } from 'Component';
import { observer } from 'mobx-react';
import { I, S, U, analytics, Action, translate, Preview, sidebar, Storage } from 'Lib';

import PageAccount from './account';
import PageDelete from './delete';
import PagePersonal from './personal';
import PagePhrase from './phrase';
import PageLanguage from './language';

import PageDataIndex from './data/index';
import PageDataPublish from './data/publish';

import PagePinIndex from './pin/index';
import PagePinSelect from './pin/select';
import PagePinConfirm from './pin/confirm';

import PageImportIndex from './import/index';
import PageImportNotion from './import/notion';
import PageImportNotionHelp from './import/notion/help';
import PageImportNotionWarning from './import/notion/warning';
import PageImportCsv from './import/csv';

import PageExportIndex from './export/index';
import PageExportProtobuf from './export/protobuf';
import PageExportMarkdown from './export/markdown';

import PageSpaceIndex from './space/index';
import PageSpaceStorageManager from './space/storage';
import PageSpaceShare from './space/share';
import PageSpaceList from './space/list';

import PageMainSet from '../set';
import PageMainRelation from '../relation';
import PageMainArchive from '../archive';

import PageMembership from './membership';

interface State {
	loading: boolean;
};

const Components: any = {
	index: 				 PageAccount,
	account:			 PageAccount,
	delete:				 PageDelete,
	personal:			 PagePersonal,
	phrase:				 PagePhrase,
	membership:			 PageMembership,
	language:			 PageLanguage,

	pinIndex:			 PagePinIndex,
	pinSelect:			 PagePinSelect,
	pinConfirm:			 PagePinConfirm,

	dataIndex: 			 PageDataIndex,
	dataPublish:		 PageDataPublish,

	importIndex:		 PageImportIndex,
	importNotion:		 PageImportNotion,
	importNotionHelp:	 PageImportNotionHelp,
	importNotionWarning: PageImportNotionWarning,
	importCsv:			 PageImportCsv,

	exportIndex:		 PageExportIndex,
	exportProtobuf:		 PageExportProtobuf,
	exportMarkdown:		 PageExportMarkdown,

	spaceIndex:			 PageSpaceIndex,
	spaceIndexEmpty:			 PageSpaceIndex,
	spaceStorageManager: PageSpaceStorageManager,
	spaceShare:			 PageSpaceShare,
	spaceList:			 PageSpaceList,

	set:				 PageMainSet,
	relation:			 PageMainRelation,
	archive: 			 PageMainArchive,
};

const SPACE_PAGES = [
	'spaceIndex', 'spaceIndexEmpty', 'spaceStorageManager', 'spaceShare',
	'importIndex', 'importNotion', 'importNotionHelp', 'importNotionWarning', 'importCsv', 
	'exportIndex', 'exportProtobuf', 'exportMarkdown',
	'set', 'relation', 'archive',
];

const SKIP_CONTAINER = [ 'set', 'relation', 'archive' ];

const PageMainSettings = observer(class PageMainSettings extends React.Component<I.PageComponent, State> {

	ref: any = null;
	onConfirmPin: any = null;

	state = {
		loading: false,
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.getId = this.getId.bind(this);
		this.isSpace = this.isSpace.bind(this);
		this.onExport = this.onExport.bind(this);
		this.setConfirmPin = this.setConfirmPin.bind(this);
		this.onSpaceTypeTooltip = this.onSpaceTypeTooltip.bind(this);
		this.setLoading = this.setLoading.bind(this);
		this.storageGet = this.storageGet.bind(this);
		this.storageSet = this.storageSet.bind(this);
	};

	render () {
		const param = U.Router.getParam(U.Router.getRoute());
		const id = param.id || 'account';

		if (!Components[id]) {
			return null;
		};

		const Component = Components[id];

		let content = (
			<div id={this.getId()} className={[ 'settingsPage', this.getId() ].join(' ')} >
				<Component
					ref={ref => this.ref = ref}
					{...this.props}
					getId={this.getId}
					onPage={id => U.Object.openAuto({ id, layout: I.ObjectLayout.Settings })}
					onExport={this.onExport}
					onConfirmPin={this.onConfirmPin}
					setConfirmPin={this.setConfirmPin}
					setLoading={this.setLoading}
					onSpaceTypeTooltip={this.onSpaceTypeTooltip}
					storageGet={this.storageGet}
					storageSet={this.storageSet}
				/>
			</div>
		);

		if (!SKIP_CONTAINER.includes(id)) {
			content = (
				<>
					<Header {...this.props} component="mainSettings" />
					<div className="settingsPageContainer" id="settingsPageContainer">
						{content}
					</div>
					<Footer component="mainObject" {...this.props} />
				</>
			);
		};

		return content;
	};

	componentDidMount () {
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};

	componentWillUnmount () {
		const space = U.Space.getSpaceview();

		S.Common.getRef('vault')?.setActive(space.id);
	};

	init () {
		if (this.isSpace()) {
			if (!U.Space.canMyParticipantWrite()) {
				return;
			};
			const param = U.Router.getParam(U.Router.getRoute());
			const id = param.id;

			let page = '';
			switch (id) {
				case 'spaceIndexEmpty': {
					page = 'widget';
					break;
				};

				case 'set': {
					page = 'types';
					break;
				};

				case 'relation': {
					page = 'relations';
					break;
				};

				default: {
					page = 'settingsSpace';
					break;
				};
			};

			sidebar.leftPanelSetState({ page });
		} else {
			S.Common.getRef('vault')?.setActive('settings');
			sidebar.leftPanelSetState({ page: 'settings' });
		};
	};

	onExport (type: I.ExportType, param: any) {
		analytics.event('ClickExport', { type, route: analytics.route.settings });
		Action.export(S.Common.space, [], type, { ...param, route: analytics.route.settings }, () => {
			// callback?
		});
	};

	setConfirmPin (v: () => void) {
		this.onConfirmPin = v;
		this.forceUpdate();
	};

	onSpaceTypeTooltip (e) {
		Preview.tooltipShow({
			title: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipTitle'),
			text: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipText'),
			className: 'big',
			element: $(e.currentTarget),
			typeY: I.MenuDirection.Bottom,
			typeX: I.MenuDirection.Left,
		});
	};

	setLoading (v: boolean) {
		this.setState({ loading: v });
	};

	storageGet () {
		return Storage.get(this.getId()) || {};
	};

	storageSet (data: any) {
		Storage.set(this.getId(), data);
	};

	getId () {
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const id = param.id || 'account';

		return U.Common.toCamelCase(`pageSettings-${id}`);
	};

	isSpace () {
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const id = param.id || 'account';

		return SPACE_PAGES.includes(id);
	};

	resize () {
		if (this.ref && this.ref.resize) {
			this.ref.resize();
		};
	};

});

export default PageMainSettings;
