import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, ListObjectPreview, Deleted } from 'Component';
import { I, M, C, DataUtil, ObjectUtil, Util, Action } from 'Lib';
import { blockStore, detailStore, dbStore } from 'Store';
import Controls from 'Component/page/head/controls';
import HeadSimple from 'Component/page/head/simple';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

interface State {
	isDeleted: boolean;
};

const PageMainSpace = observer(class PageMainSpace extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	loading = false;
	timeout = 0;
	refHeader: any = null;
	refHead: any = null;

	state = {
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.resize = this.resize.bind(this);
	};

	render () {
		if (this.state.isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (this.loading) {
			return <Loader id="loader" />;
		};

		const rootId = this.getRootId();
		const check = DataUtil.checkDetails(rootId);
		const object = Util.objectCopy(detailStore.get(rootId, rootId, []));
		const children = blockStore.getChildren(rootId, rootId, it => it.id == Constant.blockId.dataview);
		const subIdHighlighted = this.getSubIdHighlighted();

		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const highlighted = dbStore.getRecords(subIdHighlighted, '').map(id => detailStore.get(subIdHighlighted, id, []));

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'setWrapper', check.className ].join(' ')}
			>
				<Header component="mainEdit" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} />

				{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} /> : ''}

				<div className="blocks wrapper">
					<Controls key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
					<HeadSimple ref={ref => { this.refHead = ref;}} type="space" rootId={rootId} />

					<div className="section template">
						<div className="title">
							{highlighted.length} highlighted {Util.cntWord(highlighted.length, 'object', 'objects')}
						</div>
						{highlighted.length ? (
							<div className="content">
								<ListObjectPreview 
									key="listTemplate"
									getItems={() => { return highlighted; }}
									canAdd={false}
									onClick={(e: any, item: any) => { ObjectUtil.openPopup(item); }} 
								/>
							</div>
						) : (
							<div className="empty">
								This space doesn&apos;t have any highlighted objects
							</div>
						)}
					</div>
					
					{children.map((block: I.Block, i: number) => (
						<Block {...this.props} key={block.id} rootId={rootId} iconSize={20} block={block} />
					))}
				</div>

				<Footer component="mainEdit" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
	};

	componentDidUpdate () {
		this.open();
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
	};

	open () {
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();

		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					ObjectUtil.openHome('route');
				};
				return;
			};

			this.loading = false;
			this.loadHighlighted();
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
			if (this.refHead) {
				this.refHead.forceUpdate();
			};

			this.resize();
		});
	};

	loadHighlighted () {
		const rootId = this.getRootId();

		DataUtil.searchSubscribe({
			subId: this.getSubIdHighlighted(),
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'isHighlighted', condition: I.FilterCondition.Equal, value: true },
				{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: rootId },
				{ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: rootId },
			],
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc }
			],
			keys: [ 'id' ],
			ignoreWorkspace: true,
			ignoreDeleted: true,
		});
	};

	close () {
		const { isPopup, match } = this.props;
		const rootId = this.getRootId();
		
		let close = true;
		if (isPopup && (match.params.id == rootId)) {
			close = false;
		};

		if (close) {
			Action.pageClose(rootId, true);
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	resize () {
		if (this.loading || !this._isMounted) {
			return;
		};
		
		const win = $(window);
		const { isPopup } = this.props;
		const node = $(this.node);
		const cover = node.find('.block.blockCover');
		const container = Util.getPageContainer(isPopup);
		const header = container.find('#header');
		const hh = isPopup ? header.height() : Util.sizeHeader();

		if (cover.length) {
			cover.css({ top: hh });
		};

		container.css({ minHeight: isPopup ? '' : win.height() });
		node.css({ paddingTop: isPopup ? 0 : hh });
	};

	getSubIdHighlighted () {
		return dbStore.getSubId(this.getRootId(), 'highlighted');
	};

});

export default PageMainSpace;