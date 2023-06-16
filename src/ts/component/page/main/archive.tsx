import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Header, Footer, ObjectDescription, Icon, ListObjectManager } from 'Component';
import { C, I, UtilCommon, analytics, translate } from 'Lib';
import { popupStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.PageComponent {
	isPopup?: boolean;
};

const PageMainArchive = observer(class PageMainArchive extends React.Component<Props, {}> {

	refManager: any = null;
	rowLength = 0;

	constructor (props: Props) {
		super(props);

		this.onRestore = this.onRestore.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.resize = this.resize.bind(this);
		this.getRowLength = this.getRowLength.bind(this);
	};
	
	render () {
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
		];
		const sorts: I.Sort[] = [
			{ type: I.SortType.Desc, relationKey: 'lastModifiedDate' },
		];

		const buttons: I.ButtonComponent[] = [
			{ icon: 'restore', text: 'Restore', onClick: this.onRestore },
			{ icon: 'remove', text: 'Delete immediately', onClick: this.onRemove }
		];

		const Info = (item: any) => (
			<ObjectDescription object={item} />
		);

		return (
			<div className="wrapper">
				<Header component="mainEmpty" text="Bin" layout={I.ObjectLayout.Archive} {...this.props} />

				<div className="body">
					<div className="titleWrapper">
						<Icon className="archive" />
						<Title text="Bin" />
					</div>

					<ListObjectManager
						ref={ref => this.refManager = ref}
						subId={Constant.subId.archive}
						filters={filters}
						sorts={sorts}
						rowLength={this.getRowLength()}
						withArchived={true}
						buttons={buttons}
						Info={Info}
						iconSize={48}
						resize={this.resize}
						textEmpty={translate('archiveEmptyLabel')}
					/>
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};

	onRestore () {
		if (!this.refManager) {
			return;
		};

		const count = this.refManager.selected.length;

		C.ObjectListSetIsArchived(this.refManager.selected, false, () => {
			analytics.event('RestoreFromBin', { count });
		});
		this.refManager.selectionClear();
	};

	onRemove () {
		if (!this.refManager) {
			return;
		};

		const count = this.refManager.selected.length;

		analytics.event('ShowDeletionWarning', { route: 'Bin' });

		popupStore.open('confirm', {
			data: {
				title: `Are you sure you want to delete ${count} ${UtilCommon.cntWord(count, 'object', 'objects')}?`,
				text: 'These objects will be deleted irrevocably. You can\'t undo this action.',
				textConfirm: 'Delete',
				onConfirm: () => { 
					C.ObjectListDelete(this.refManager.selected);
					this.refManager.selectionClear();

					analytics.event('RemoveCompletely', { count, route: 'Bin' });
				},
				onCancel: () => { this.refManager.selectionClear(); }
			},
		});
	};

	getRowLength () {
		const { ww } = UtilCommon.getWindowDimensions();
		return ww <= 940 ? 2 : 3;
	};

	resize () {
		const win = $(window);
		const container = UtilCommon.getPageContainer(this.props.isPopup);
		const node = $(ReactDOM.findDOMNode(this));
		const content = $('#popupPage .content');
		const body = node.find('.body');
		const hh = UtilCommon.sizeHeader();
		const isPopup = this.props.isPopup && !container.hasClass('full');
		const wh = isPopup ? container.height() : win.height();
		const rowLength = this.getRowLength();

		node.css({ height: wh });
		
		if (isPopup) {
			body.css({ height: wh - hh });
			content.css({ minHeight: 'unset', height: '100%' });
		} else {
			body.css({ height: '' });
			content.css({ minHeight: '', height: '' });
		};

		if (this.rowLength != rowLength) {
			this.rowLength = rowLength;
			this.forceUpdate();
		};	
	};

});

export default PageMainArchive;