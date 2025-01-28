import * as React from 'react';
import { observer } from 'mobx-react';
import { I, S, U, analytics, Action, keyboard, translate, Preview, Onboarding } from 'Lib';

import PageAccount from './account';
import PageDelete from './delete';
import PagePersonal from './personal';
import PageAppearance from './appearance';
import PagePhrase from './phrase';
import PageLogout from './logout';

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
import PageSpaceMembers from './space/members';
import PageSpaceList from './space/list';

import PageMembership from './membership';

interface State {
	loading: boolean;
};

const Components: any = {
	account:			 PageAccount,
	delete:				 PageDelete,
	personal:			 PagePersonal,
	appearance:			 PageAppearance,
	phrase:				 PagePhrase,
	membership:			 PageMembership,
	logout:				 PageLogout,

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
	spaceStorageManager: PageSpaceStorageManager,
	spaceShare:			 PageSpaceShare,
	spaceMembers:		 PageSpaceMembers,
	spaceList:			 PageSpaceList,
};


const PageMainSettings = observer(class PageMainSettings extends React.Component<I.PageComponent, State> {

	ref: any = null;

	render () {
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const id = param.id || 'account';

		if (!Components[id]) {
			return;
		};

		const Component = Components[id];

		return (
			<div className="settingsPageContainer">
				<div className={U.Common.toCamelCase(`pageSettings-${id}`)}>
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
				</div>
			</div>
		);
	};

	prevPage () {

	};

	onPage () {

	};

	onExport () {

	};

	onConfirmPin () {

	};

	setConfirmPin () {

	};

	setPinConfirmed () {

	};

	setLoading () {

	};

	onSpaceTypeTooltip () {

	};

});

export default PageMainSettings;
