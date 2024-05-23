import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Deleted } from 'Component';
import { I, M, C, UtilData, UtilCommon, Action, UtilSpace, keyboard, UtilRouter, translate } from 'Lib';
import { blockStore, detailStore, dbStore, menuStore } from 'Store';
import Controls from 'Component/page/elements/head/controls';
import HeadSimple from 'Component/page/elements/head/simple';
const Constant = require('json/constant.json');

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
	refControls: any = null;
	loading = false;
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
			const isCollection = object.layout == I.ObjectLayout.Collection;
			const children = blockStore.getChildren(rootId, rootId, it => it.isDataview());
			const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });
			const placeholder = isCollection ? translate('defaultNameCollection') : translate('defaultNameSet');

			content = (
				<React.Fragment>
					{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} /> : ''}

					<div className="blocks wrapper">
						<Controls ref={ref => this.refControls = ref} key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
						<HeadSimple 
							{...this.props} 
							ref={ref => this.refHead = ref} 
							placeholder={placeholder} rootId={rootId} 
						/>

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
								readonly={this.isReadonly()}
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
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

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

		win.on(`keydown.set${namespace}`, e => this.onKeyDown(e));
		container.on(`scroll.set${namespace}`, () => this.onScroll());
	};

	checkDeleted () {
		const { isDeleted } = this.state;
		if (isDeleted) {
			return;
		};

		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, []);

		if (object.isDeleted) {
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

		this.close();
		this.id = rootId;
		this.setState({ isDeleted: false, isLoading: true });

		C.ObjectOpen(rootId, '', UtilRouter.getRouteSpaceId(), (message: any) => {
			if (!UtilCommon.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			this.refControls?.forceUpdate();
			this.setState({ isLoading: false });
			this.resize();
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup, match } = this.props;
		
		let close = true;
		if (isPopup && (match.params.id == this.id)) {
			close = false;
		};
		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	onScroll () {
		const { dataset, isPopup } = this.props;

		if (!isPopup && keyboard.isPopup()) {
			return;
		};

		const { selection } = dataset || {};
		if (selection) {
			selection.renderSelection();
		};
	};

	onKeyDown (e: any): void {
		const { dataset, isPopup } = this.props;

		if (!isPopup && keyboard.isPopup()) {
			return;
		};

		const node = $(this.node);
		const { selection } = dataset || {};
		const cmd = keyboard.cmdKey();
		const ids = selection ? selection.get(I.SelectType.Record) : [];
		const count = ids.length;
		const rootId = this.getRootId();

		keyboard.shortcut(`${cmd}+f`, e, () => {
			e.preventDefault();

			node.find('#dataviewControls .filter .icon.search').trigger('click');
		});

		if (!keyboard.isFocused) {
			keyboard.shortcut(`${cmd}+a`, e, () => {
				e.preventDefault();

				const records = dbStore.getRecordIds(dbStore.getSubId(rootId, Constant.blockId.dataview), '');
				selection.set(I.SelectType.Record, records);
			});

			if (count && !menuStore.isOpen()) {
				keyboard.shortcut('backspace, delete', e, () => {
					e.preventDefault();
					Action.archive(ids);
					selection.clear();
				});
			};
		};
	};

	isReadonly () {
		return !UtilSpace.canMyParticipantWrite();
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
