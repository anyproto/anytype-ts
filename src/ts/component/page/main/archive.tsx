import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { Title, Header, Footer, ObjectDescription, Icon, ListObjectManager } from 'Component';
import { C, I, Util, analytics, translate } from 'Lib';
import { popupStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.PageComponent {
	isPopup?: boolean;
};

const PageMainArchive = observer(class PageMainArchive extends React.Component<Props, {}> {

	manager: any = null;

	constructor (props: Props) {
		super(props);

		this.onRestore = this.onRestore.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.resize = this.resize.bind(this);
	};
	
	render () {
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
		];

		const buttons: I.ButtonComponent[] = [
			{ icon: 'restore', text: 'Restore', onClick: this.onRestore },
			{ icon: 'remove', text: 'Delete immediately', onClick: this.onRemove }
		];

		const Info = (item: any) => (
			<React.Fragment>
				<ObjectDescription object={item} />
			</React.Fragment>
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
						ref={ref => { this.manager = ref; }}
						subId={Constant.subId.archive}
						filters={filters}
						rowLength={3}
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
		if (!this.manager.selected) {
			return;
		};

		const count = this.manager.selected.length;

		C.ObjectListSetIsArchived(this.manager.selected, false, () => {
			analytics.event('RestoreFromBin', { count });
		});
		this.manager.selectionClear();
	};

	onRemove () {
		if (!this.manager.selected) {
			return;
		};

		const count = this.manager.selected.length;

		analytics.event('ShowDeletionWarning');

		popupStore.open('confirm', {
			data: {
				title: `Are you sure you want to delete ${count} ${Util.cntWord(count, 'object', 'objects')}?`,
				text: 'These objects will be deleted irrevocably. You can\'t undo this action.',
				textConfirm: 'Delete',
				onConfirm: () => { 
					C.ObjectListDelete(this.manager.selected);
					this.manager.selectionClear();

					analytics.event('RemoveCompletely', { count });
				},
				onCancel: () => { this.manager.selectionClear(); }
			},
		});
	};

	resize () {
		const win = $(window);
		const container = Util.getPageContainer(this.props.isPopup);
		const node = $(ReactDOM.findDOMNode(this));
		const content = $('#popupPage .content');
		const body = node.find('.body');
		const hh = Util.sizeHeader();
		const isPopup = this.props.isPopup && !container.hasClass('full');
		const wh = isPopup ? container.height() : win.height();

		node.css({ height: wh });
		
		if (isPopup) {
			body.css({ height: wh - hh });
			content.css({ minHeight: 'unset', height: '100%' });
		} else {
			body.css({ height: '' });
			content.css({ minHeight: '', height: '' });
		};
	};

});

export default PageMainArchive;