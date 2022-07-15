import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Header, FooterMainEdit as Footer, Loader, Block, Deleted } from 'ts/component';
import { I, M, C, DataUtil, Util, crumbs, Action } from 'ts/lib';
import { blockStore, dbStore, menuStore } from 'ts/store';

import Controls from 'ts/component/page/head/controls';
import HeadSimple from 'ts/component/page/head/simple';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

interface State {
	isDeleted: boolean;
};

const $ = require('jquery');
const raf = require('raf');
const Errors = require('json/error.json');

const PageMainSet = observer(class PageMainSet extends React.Component<Props, State> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	refHead: any = null;
	loading: boolean = false;
	composition: boolean = false;
	timeout: number = 0;

	state = {
		isDeleted: false,
	};

	constructor (props: any) {
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

		const children = blockStore.getChildren(rootId, rootId, (it: any) => { return it.isDataview(); });
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });

		return (
			<div className={[ 'setWrapper', check.className ].join(' ')}>
				<Header component="mainEdit" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} /> : ''}

				<div className="blocks wrapper">
					<Controls key="editorControls" {...this.props} rootId={rootId} resize={this.resize} />
					<HeadSimple ref={(ref: any) => { this.refHead = ref;}} type="set" rootId={rootId} />

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

				<Footer {...this.props} rootId={rootId} />
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
					Util.route('/main/index');
				};
				return;
			};

			crumbs.addRecent(rootId);

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

	onAdd (e: any) {
		const rootId = this.getRootId();
		const relations = dbStore.getRelations(rootId, rootId);

		menuStore.open('relationSuggest', { 
			element: $(e.currentTarget),
			offsetX: 32,
			data: {
				filter: '',
				rootId: rootId,
				ref: 'set',
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map((it: I.Relation) => { return it.relationKey; }),
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any, onChange?: (relation: any) => void) => {
					C.ObjectRelationAdd(rootId, relation, () => { 
						menuStore.close('relationSuggest'); 

						if (onChange) {
							onChange(relation);
						};
					});
				},
			}
		});
	};

	onEdit (e: any, relationKey: string) {
		const rootId = this.getRootId();
		
		menuStore.open('blockRelationEdit', { 
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				relationKey: relationKey,
				readonly: false,
				updateCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationUpdate(rootId, relation);
				},
				deleteCommand: (rootId: string, blockId: string, relationKey: string) => {
					C.ObjectRelationDelete(rootId, relationKey);
				},
			}
		});
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
			const node = $(ReactDOM.findDOMNode(this));
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