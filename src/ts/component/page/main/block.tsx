import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Header, Loader, Block, Deleted } from 'Component';
import { I, C, UtilCommon, Action, UtilObject, translate } from 'Lib';
import { blockStore, detailStore } from 'Store';
import Errors from 'json/error.json';

interface State {
	isDeleted: boolean;
};

const PageMainBlock = observer(class PageMainBlock extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	node: any = null;
	id = '';
	refHeader: any = null;
	loading = false;

	state = {
		isDeleted: false,
	};

	constructor (props: any) {
		super(props);
		
		this.resize = this.resize.bind(this);
	};

	render () {
		const { params } = this.getMatch();
		const { blockId } = params;

		if (this.state.isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (this.loading) {
			return <Loader id="loader" />;
		};

		const rootId = this.getRootId();
		const block = blockStore.getLeaf(rootId, blockId);

		return (
			<div 
				ref={node => this.node = node}
				className="setWrapper"
			>
				<Header component="mainObject" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} />

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

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();

		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					UtilObject.openHome('route');
				};
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isArchived || object.isDeleted) {
				this.setState({ isDeleted: true });
				return;
			};

			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
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

	getMatch () {
		const { match, matchPopup, isPopup } = this.props;
		return (isPopup ? matchPopup : match) || { params: {} };
	};

	resize () {
		if (this.loading || !this._isMounted) {
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