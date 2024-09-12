import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Deleted } from 'Component';
import { I, M, C, S, U, J, Action, keyboard, translate, sidebar } from 'Lib';
import Controls from 'Component/page/elements/head/controls';
import HeadSimple from 'Component/page/elements/head/simple';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const PageMainChat = observer(class PageMainChat extends React.Component<I.PageComponent, State> {

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
		const check = U.Data.checkDetails(rootId);
		const readonly = this.isReadonly();

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		let content = null;

		if (isLoading) {
			content = <Loader id="loader" />;
		} else {
			const children = S.Block.getChildren(rootId, rootId, it => it.isChat());
			const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });

			content = (
				<React.Fragment>
					{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} /> : ''}

					<div className="blocks">
						<Controls ref={ref => this.refControls = ref} key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
						<HeadSimple 
							{...this.props} 
							ref={ref => this.refHead = ref} 
							placeholder={translate('defaultNamePage')} 
							rootId={rootId} 
							readonly={readonly}
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
								isContextMenuDisabled={true}
								readonly={readonly}
							/>
						))}
					</div>
				</React.Fragment>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

				<div id="bodyWrapper" className="wrapper">
					<div className={[ 'editorWrapper', check.className ].join(' ')}>
						{content}
					</div>
				</div>

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
		const container = U.Common.getScrollContainer(isPopup);

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
		const object = S.Detail.get(rootId, rootId, []);

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

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
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
		const { isPopup } = this.props;

		if (!isPopup && keyboard.isPopup()) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		if (selection) {
			selection.renderSelection();
		};
	};

	onKeyDown (e: any): void {
		const { isPopup } = this.props;

		if (!isPopup && keyboard.isPopup()) {
			return;
		};

		const node = $(this.node);
		const selection = S.Common.getRef('selectionProvider');
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

				const records = S.Record.getRecordIds(S.Record.getSubId(rootId, J.Constant.blockId.dataview), '');
				selection.set(I.SelectType.Record, records);
			});

			if (count && !S.Menu.isOpen()) {
				keyboard.shortcut('backspace, delete', e, () => {
					e.preventDefault();
					Action.archive(ids);
					selection.clear();
				});
			};
		};
	};

	isReadonly () {
		const rootId = this.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);
		const object = S.Detail.get(rootId, rootId, []);

		return !U.Space.canMyParticipantWrite() || object.isArchived || root?.isLocked();
	};

	resize () {
		const { isLoading } = this.state;
		const { isPopup } = this.props;

		if (!this._isMounted || isLoading) {
			return;
		};

		const rootId = this.getRootId();
		const check = U.Data.checkDetails(rootId);

		raf(() => {
			const node = $(this.node);
			const cover = node.find('.block.blockCover');
			const pageContainer = U.Common.getPageContainer(isPopup);
			const scrollContainer = U.Common.getScrollContainer(isPopup);
			const header = pageContainer.find('#header');
			const headerHeight = isPopup ? header.height() : J.Size.header;
			const scrollWrapper = node.find('#scrollWrapper');
			const formWrapper = node.find('#formWrapper').addClass('isFixed');
			const controls = node.find('.editorControls');
			const head = node.find('.headSimple');

			if (cover.length) {
				cover.css({ top: headerHeight });
			};

			const fh = Number(formWrapper.outerHeight(true)) || 0;
			const ch = Number(controls.outerHeight(true)) || 0;
			const hh = Number(head.outerHeight(true)) || 0;
			const mh = scrollContainer.height() - headerHeight - fh - ch - hh - (check.withCover ? J.Size.coverPadding : 0) + 8;

			scrollWrapper.css({ minHeight: mh });
		});
	};

});

export default PageMainChat;