import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Loader, Block, Deleted } from 'Component';
import { I, C, UtilCommon, Action, UtilSpace, translate, UtilRouter } from 'Lib';
import { blockStore, detailStore } from 'Store';
const Errors = require('json/error.json');

interface State {
	isDeleted: boolean;
	isLoading: boolean;
};

const PageMainBlock = observer(class PageMainBlock extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;

	state = {
		isDeleted: false,
		isLoading: true,
	};

	constructor (props: any) {
		super(props);
		
		this.resize = this.resize.bind(this);
	};

	render () {
		const { params } = this.getMatch();
		const { blockId } = params;
		const { isDeleted, isLoading } = this.state;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (isLoading) {
			return <Loader id="loader" />;
		};

		const rootId = this.getRootId();
		const block = blockStore.getLeaf(rootId, blockId);

		return (
			<div 
				ref={node => this.node = node}
				className="setWrapper"
			>
				<Header 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					{...this.props} 
					rootId={rootId} 
				/>

				<div className="blocks wrapper">
					{block ? (
						<Block 
							{...this.props} 
							key={block.id} 
							rootId={rootId} 
							iconSize={20} 
							block={block} 
							className="noPlus" 
						/>
					) : translate('pageMainBlockEmpty')}
				</div>
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

		this.close();
		this.id = rootId;
		this.setState({ isLoading: true });

		C.ObjectOpen(rootId, '', UtilRouter.getRouteSpaceId(), (message: any) => {
			if (!UtilCommon.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};

			this.setState({ isLoading: true });
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

	getMatch () {
		const { match, matchPopup, isPopup } = this.props;
		return (isPopup ? matchPopup : match) || { params: {} };
	};

	resize () {
		const { isLoading } = this.state;

		if (!this._isMounted || isLoading) {
			return;
		};

		const win = $(window);
		const { isPopup } = this.props;
		
		raf(() => {
			const node = $(this.node);
			const container = UtilCommon.getPageContainer(isPopup);
			const header = container.find('#header');
			const hh = isPopup ? header.height() : UtilCommon.sizeHeader();

			container.css({ minHeight: isPopup ? '' : win.height() });
			node.css({ paddingTop: isPopup ? 0 : hh });
		});
	};

});

export default PageMainBlock;