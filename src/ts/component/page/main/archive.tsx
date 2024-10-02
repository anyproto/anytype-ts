import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Title, Footer, Icon, ListObjectManager } from 'Component';
import { I, U, J, translate, Action, analytics } from 'Lib';

const PageMainArchive = observer(class PageMainArchive extends React.Component<I.PageComponent> {

	refManager: any = null;
	rowLength = 0;

	constructor (props: I.PageComponent) {
		super(props);

		this.onRestore = this.onRestore.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.resize = this.resize.bind(this);
		this.getRowLength = this.getRowLength.bind(this);
	};
	
	render () {
		const filters: I.Filter[] = [
			{ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
		];
		const sorts: I.Sort[] = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
		];

		const buttons: I.ButtonComponent[] = [
			{ icon: 'restore', text: translate('commonRestore'), onClick: this.onRestore },
			{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: this.onRemove }
		];

		return (
			<div className="wrapper">
				<div className="body">
					<div className="titleWrapper">
						<Icon className="archive" />
						<Title text={translate('commonBin')} />
					</div>

					<ListObjectManager
						ref={ref => this.refManager = ref}
						subId={J.Constant.subId.archive}
						filters={filters}
						sorts={sorts}
						rowLength={this.getRowLength()}
						withArchived={true}
						buttons={buttons}
						iconSize={48}
						resize={this.resize}
						textEmpty={translate('pageMainArchiveEmpty')}
						isReadonly={!U.Space.canMyParticipantWrite()}
					/>
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};

	componentDidMount () {
		analytics.event('ScreenBin');
	};

	onRestore () {
		if (!this.refManager) {
			return;
		};

		Action.restore(this.refManager.selected || []);
		this.selectionClear();
	};

	onRemove () {
		Action.delete(this.refManager?.selected || [], 'Bin', () => this.selectionClear());
	};

	selectionClear () {
		this.refManager?.selectionClear();
	};

	getRowLength () {
		const { ww } = U.Common.getWindowDimensions();
		return ww <= 940 ? 2 : 3;
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const container = U.Common.getPageContainer(isPopup);
		const node = $(ReactDOM.findDOMNode(this));
		const content = $('#popupPage .content');
		const body = node.find('.body');
		const hh = J.Size.header;
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
