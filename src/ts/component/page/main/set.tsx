import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, Block, Deleted } from 'Component';
import { I, M, C, DataUtil, Util, Action, ObjectUtil } from 'Lib';
import { blockStore } from 'Store';
import Controls from 'Component/page/head/controls';
import HeadSimple from 'Component/page/head/simple';
import Errors from 'json/error.json';
import Constant from 'json/constant.json';

interface State {
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
		const { object } = check;
		const isCollection = object.type === Constant.typeId.collection;

		const children = blockStore.getChildren(rootId, rootId, it => it.isDataview());
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'setWrapper', check.className ].join(' ')}
			>
				<Header component="mainEdit" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} />

				{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} /> : ''}

				<div className="blocks wrapper">
					<Controls key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
					<HeadSimple ref={ref => { this.refHead = ref;}} type={isCollection ? 'collection' : 'set'} rootId={rootId} />

					{children.map((block: I.Block, i: number) => (
						<Block 
							{...this.props} 
							key={block.id} 
							rootId={rootId} 
							iconSize={20} 
							block={block} 
							className="noPlus" 
						/>
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