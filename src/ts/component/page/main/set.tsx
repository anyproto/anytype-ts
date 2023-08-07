import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Deleted } from 'Component';
import { I, M, C, UtilData, UtilCommon, Action, UtilObject, keyboard, analytics } from 'Lib';
import { blockStore, detailStore, popupStore, dbStore } from 'Store';
import Controls from 'Component/page/head/controls';
import HeadSimple from 'Component/page/head/simple';
import Errors from 'json/error.json';
import Constant from 'json/constant.json';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const PageMainSet = observer(class PageMainSet extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	loading = false;
	composition = false;
	timeout = 0;
	blockRefs: any = {};

	state = {
		isLoading: false,
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.resize = this.resize.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;
		const rootId = this.getRootId();
		const check = UtilData.checkDetails(rootId);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		let content = null;

		if (isLoading) {
			content = <Loader id="loader" />;
		} else {
			const object = detailStore.get(rootId, rootId, []);
			const isCollection = object.type === Constant.typeId.collection;

			const children = blockStore.getChildren(rootId, rootId, it => it.isDataview());
			const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });

			content = (
				<React.Fragment>
					{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} /> : ''}

					<div className="blocks wrapper">
						<Controls key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
						<HeadSimple ref={ref => this.refHead = ref} type={isCollection ? 'Collection' : 'Set'} rootId={rootId} />

						{children.map((block: I.Block, i: number) => (
							<Block
								{...this.props}
								ref={ref => this.blockRefs[block.id] = ref}
								key={block.id}
								rootId={rootId}
								iconSize={20}
								block={block}
								className="noPlus"
								isSelectionDisabled={true}
							/>
						))}
					</div>
				</React.Fragment>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'setWrapper', check.className ].join(' ')}
			>
				<Header component="mainObject" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} />

				{content}

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
		this.rebind();
	};

	componentDidUpdate () {
		this.open();
		this.resize();
		this.checkDeleted();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
		this.unbind();
	};

	unbind () {
		const namespace = this.getNamespace();
		const events = [ 'keydown', 'scroll' ];

		$(window).off(events.map(it => `${it}.set${namespace}`).join(' '));
	};

	rebind () {
		const { isPopup } = this.props;
		const win = $(window);
		const namespace = this.getNamespace();
		const container = UtilCommon.getScrollContainer(isPopup);

		this.unbind();

		win.on('keydown.set' + namespace, e => this.onKeyDown(e));
		container.on('scroll.set' + namespace, e => this.onScroll());
	};

	checkDeleted () {
		const { isDeleted } = this.state;
		if (isDeleted) {
			return;
		};

		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, []);

		if (object.isArchived || object.isDeleted) {
			this.setState({ isDeleted: true });
		};
	};

	getNamespace () {
		return this.props.isPopup ? '-popup' : '';
	};

	open () {
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.setState({ isDeleted: false, isLoading: true });

		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true, isLoading: false });
				} else {
					UtilObject.openHome('route');
				};
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isArchived || object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.setState({ isLoading: false });

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};

			if (this.refHead) {
				this.refHead.forceUpdate();
			};

			this.resize();
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

	onScroll () {
		const { dataset, isPopup } = this.props;

		if (!isPopup && popupStore.isOpen('page')) {
			return;
		};

		const { selection } = dataset || {};
		if (selection) {
			selection.renderSelection();
		};
	};

	onKeyDown (e: any): void {
		const { dataset, isPopup } = this.props;

		if (!isPopup && popupStore.isOpen('page')) {
			return;
		};

		const { selection } = dataset || {};
		const cmd = keyboard.cmdKey();
		const ids = selection ? selection.get(I.SelectType.Record) : [];
		const count = ids.length;
		const rootId = this.getRootId();

		if (!keyboard.isFocused) {
			keyboard.shortcut(`${cmd}+a`, e, () => {
				const subId = dbStore.getSubId(rootId, Constant.blockId.dataview);
				const records = dbStore.getRecords(subId, '');

				selection.set(I.SelectType.Record, records);
			});
		};

		if (count) {
			keyboard.shortcut('backspace, delete', e, () => {
				e.preventDefault();
				C.ObjectListSetIsArchived(ids, true);
				
				selection.clear();
				analytics.event('MoveToBin', { count });
			});
		};
	};

	resize () {
		const { isLoading } = this.state;
		const { isPopup } = this.props;

		if (!this._isMounted || isLoading) {
			return;
		};

		raf(() => {
			const win = $(window);
			const node = $(this.node);
			const cover = node.find('.block.blockCover');
			const container = UtilCommon.getPageContainer(isPopup);
			const header = container.find('#header');
			const hh = isPopup ? header.height() : UtilCommon.sizeHeader();

			if (cover.length) {
				cover.css({ top: hh });
			};

			container.css({ minHeight: isPopup ? '' : win.height() });
			node.css({ paddingTop: isPopup ? 0 : hh });
		});
	};

});

export default PageMainSet;
