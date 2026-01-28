import React, { forwardRef, useEffect, useRef, useState } from 'react';
import $ from 'jquery';
import { Header, Footer } from 'Component';
import { observer } from 'mobx-react';
import { I, S, U, analytics, Action, translate, Preview, sidebar, Storage, keyboard } from 'Lib';

import PageAccount from './account';
import PageDelete from './delete';
import PagePersonal from './personal';
import PagePhrase from './phrase';
import PageLanguage from './language';
import PageApi from './api';

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
import PageImportObsidian from './import/obsidian';

import PageExportIndex from './export/index';
import PageExportProtobuf from './export/protobuf';
import PageExportMarkdown from './export/markdown';

import PageSpaceIndex from './space/index';
import PageSpaceStorage from './space/storage';
import PageSpaceShare from './space/share';
import PageSpaceList from './space/list';
import PageSpaceNotifications from './space/notifications';

import PageMainSet from '../set';
import PageMainRelation from '../relation';
import PageMainArchive from '../archive';

import PageMembership from './membership/index';

const Components: any = {
	index: 				 PageAccount,
	account:			 PageAccount,
	delete:				 PageDelete,
	personal:			 PagePersonal,
	phrase:				 PagePhrase,
	membership:			 PageMembership,
	language:			 PageLanguage,
	api:				 PageApi,

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
	importObsidian:		 PageImportObsidian,

	exportIndex:		 PageExportIndex,
	exportProtobuf:		 PageExportProtobuf,
	exportMarkdown:		 PageExportMarkdown,

	spaceIndex:			 PageSpaceIndex,
	spaceIndexEmpty:	 PageSpaceIndex,
	spaceStorage:		 PageSpaceStorage,
	spaceShare:			 PageSpaceShare,
	spaceList:			 PageSpaceList,
	spaceNotifications:	 PageSpaceNotifications,

	set:				 PageMainSet,
	relation:			 PageMainRelation,
	archive: 			 PageMainArchive,
};

const SPACE_PAGES = [
	'spaceIndex', 'spaceIndexEmpty', 'spaceStorage', 'spaceShare', 'spaceNotifications',
	'importIndex', 'importNotion', 'importNotionHelp', 'importNotionWarning', 'importCsv', 'importObsidian',
	'exportIndex', 'exportProtobuf', 'exportMarkdown',
	'set', 'relation', 'archive',
];

const SKIP_CONTAINER = [ 'set', 'relation', 'archive' ];

const PageMainSettingsIndex = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const { id = 'account' } = keyboard.getMatch(isPopup).params;
	const pageId = U.String.toCamelCase(`pageSettings-${id}`);
	const confirmPinRef = useRef<any>(null);
	const childRef = useRef(null);
	const [ dummy, setDummy ] = useState(0);
	const Component = Components[id];

	const init = () => {
		let page = '';

		if (!SPACE_PAGES.includes(id)) {
			page = 'settings';
		} else {
			if (!U.Space.canMyParticipantWrite()) {
				return;
			};

			switch (id) {
				case 'spaceIndexEmpty': {
					page = 'widget';
					break;
				};

				case 'set': {
					page = 'settings/types';
					break;
				};

				case 'relation': {
					page = 'settings/relations';
					break;
				};

				default: {
					page = 'settings/space';
					break;
				};
			};
		};

		if (page) {
			sidebar.leftPanelSubPageOpen(page, false, false);
		};

		sidebar.rightPanelClose(isPopup, false);
	};

	const onExport = (type: I.ExportType, param: any) => {
		Action.export(S.Common.space, [], type, { ...param, route: analytics.route.settings });
		analytics.event('ClickExport', { type, route: analytics.route.settings });
	};

	const setConfirmPin = (v: () => void) => {
		confirmPinRef.current = v;
		setDummy(dummy + 1);
	};

	const onSpaceTypeTooltip = (e) => {
		Preview.tooltipShow({
			title: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipTitle'),
			text: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipText'),
			className: 'big',
			element: $(e.currentTarget),
			typeY: I.MenuDirection.Bottom,
			typeX: I.MenuDirection.Left,
		});
	};

	useEffect(() => init(), [ id ]);

	if (!Components[id]) {
		return null;
	};

	let content = (
		<div id={pageId} className={[ 'settingsPage', pageId ].join(' ')} >
			<Component
				ref={childRef}
				{...props}
				getId={() => pageId}
				onPage={id => Action.openSettings(id, '')}
				onExport={onExport}
				onConfirmPin={confirmPinRef.current}
				setConfirmPin={setConfirmPin}
				onSpaceTypeTooltip={onSpaceTypeTooltip}
				storageGet={() => Storage.get(pageId) || {}}
				storageSet={data => Storage.set(pageId, data)}
			/>
		</div>
	);

	if (!SKIP_CONTAINER.includes(id)) {
		content = (
			<>
				<Header {...props} component="mainSettings" />
				<div className="settingsPageContainer" id="settingsPageContainer">
					{content}
				</div>
				<Footer component="mainObject" {...props} />
			</>
		);
	};

	return content;

}));

export default PageMainSettingsIndex;
