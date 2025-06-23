import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Deleted, HeadSimple, EditorControls } from 'Component';
import { I, M, C, S, U, J, Action, keyboard, Dataview, analytics, sidebar, Onboarding } from 'Lib';

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
		const check = U.Data.checkDetails(rootId, rootId, [ 'layout' ]);

		let content = null;
		if (isDeleted) {
			content = <Deleted {...this.props} />;
		} else
		if (isLoading) {
			content = <Loader id="loader" />;
		} else {
			const children = S.Block.getChildren(rootId, rootId, it => it.isDataview());
			const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });
			const readonly = this.isReadonly();
			const placeholder = Dataview.namePlaceholder(check.layout);

			content = (
				<>
					{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} readonly={readonly} /> : ''}

					<div className="blocks wrapper">
						<EditorControls 
							ref={ref => this.refControls = ref} 
							key="editorControls" 
							{...this.props} 
							rootId={rootId} 
							resize={this.resize} 
							readonly={readonly}
						/>

						<HeadSimple 
							{...this.props} 
							ref={ref => this.refHead = ref} 
							placeholder={placeholder} 
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
								readonly={readonly}
							/>
						))}
					</div>
				</>
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
		const { isPopup } = this.props;
		const namespace = U.Common.getEventNamespace(isPopup);
		const events = [ 'keydown', 'scroll' ];

		$(window).off(events.map(it => `${it}.set${namespace}`).join(' '));
	};

	rebind () {
		const { isPopup } = this.props;
		const win = $(window);
		const namespace = U.Common.getEventNamespace(isPopup);
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

	open () {
		const { isPopup } = this.props;
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

			sidebar.rightPanelSetState(isPopup, { rootId });
			this.setState({ isLoading: false });
			this.resize();

			if (U.Object.isTypeLayout(object.layout)) {
				window.setTimeout(() => Onboarding.start('typeResetLayout', isPopup), 50);

				analytics.event('ScreenType', { objectType: object.id });
			};
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup } = this.props;
		const close = !isPopup || (this.getRootId() == this.id);

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	getRootId () {
		return keyboard.getRootId(this.props.isPopup);
	};

	onScroll () {
		const { isPopup } = this.props;
		const selection = S.Common.getRef('selectionProvider');

		if (!isPopup && keyboard.isPopup()) {
			return;
		};

		selection?.renderSelection();
	};

	onKeyDown (e: any): void {
		const { isPopup } = this.props;

		if (!isPopup && keyboard.isPopup()) {
			return;
		};

		const node = $(this.node);
		const selection = S.Common.getRef('selectionProvider');
		const cmd = keyboard.cmdKey();
		const ids = selection?.get(I.SelectType.Record) || [];
		const count = ids.length;
		const rootId = this.getRootId();
		const ref = this.blockRefs[J.Constant.blockId.dataview];

		keyboard.shortcut('searchText', e, () => {
			e.preventDefault();

			node.find('#dataviewControls .filter .icon.search').trigger('click');
		});

		keyboard.shortcut('createObject', e, () => {
			e.preventDefault();

			const { ww, wh } = U.Common.getWindowDimensions();

			ref?.ref?.onRecordAdd(e, -1, '', {
				horizontal: I.MenuDirection.Center,
				vertical: I.MenuDirection.Center,
				rect: { x: ww / 2, y: wh / 2, width: 0, height: 0 },
			});
		});

		if (!keyboard.isFocused) {
			keyboard.shortcut('selectAll', e, () => {
				e.preventDefault();

				const records = S.Record.getRecordIds(S.Record.getSubId(rootId, J.Constant.blockId.dataview), '');
				selection.set(I.SelectType.Record, records);

				$(window).trigger('selectionSet');
			});

			if (count && !S.Menu.isOpen()) {
				keyboard.shortcut('backspace, delete', e, () => {
					e.preventDefault();
					Action.archive(ids, analytics.route.set);
					selection.clear();
				});
			};
		};

		// History
		keyboard.shortcut('history', e, () => {
			e.preventDefault();
			U.Object.openAuto({ layout: I.ObjectLayout.History, id: rootId });
		});
	};

	isReadonly () {
		const rootId = this.getRootId();
		const root = S.Block.getLeaf(rootId, rootId);

		if (root && root.isLocked()) {
			return true;			
		};

		const object = S.Detail.get(rootId, rootId, [ 'isArchived' ], true);
		if (object.isArchived) {
			return true;
		};

		return !U.Space.canMyParticipantWrite();
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
			const container = U.Common.getPageContainer(isPopup);
			const header = container.find('#header');
			const hh = isPopup ? header.height() : J.Size.header;

			if (cover.length) {
				cover.css({ top: hh });
			};

			container.css({ minHeight: isPopup ? '' : win.height() });
		});
	};

});

export default PageMainSet;
