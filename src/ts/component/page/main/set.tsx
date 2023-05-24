import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Deleted } from 'Component';
import { I, M, C, DataUtil, Util, Action, ObjectUtil, keyboard, analytics } from 'Lib';
import { blockStore, detailStore, popupStore, dbStore } from 'Store';
import Controls from 'Component/page/head/controls';
import HeadSimple from 'Component/page/head/simple';
import Errors from 'json/error.json';
import Constant from 'json/constant.json';

interface State {
	isDeleted: boolean;
	isLoading: boolean;
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
		isDeleted: false,
		isLoading: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.resize = this.resize.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;
		const rootId = this.getRootId();
		const check = DataUtil.checkDetails(rootId);

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		let content = null;

		if (isLoading) {
			content = <Loader id="loader" />;
		}
		else {
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
		const container = Util.getScrollContainer(isPopup);

		this.unbind();

		win.on('keydown.set' + namespace, e => this.onKeyDown(e));
		container.on('scroll.set' + namespace, e => this.onScroll());
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
		this.setState({ isLoading: true });

		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					ObjectUtil.openHome('route');
				};
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
		const ref = this.blockRefs[Constant.blockId.dataview]?.ref;
		const rootId = this.getRootId();

		if (!ref) {
			return;
		};

		keyboard.shortcut(`${cmd}+n`, e, () => { 
			ref.onRecordAdd(e, 0, true); 
		});

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
		if (this.state.isLoading || !this._isMounted) {
			return;
		};

		const win = $(window);
		const { isPopup } = this.props;
		
		raf(() => {
			const node = $(this.node);
			const cover = node.find('.block.blockCover');
			const container = Util.getPageContainer(isPopup);
			const header = container.find('#header');
			const hh = isPopup ? header.height() : Util.sizeHeader();

			if (cover.length) {
				cover.css({ top: hh });
			};

			container.css({ minHeight: isPopup ? '' : win.height() });
			node.css({ paddingTop: isPopup && !container.hasClass('full') ? 0 : hh });
		});
	};

});

export default PageMainSet;