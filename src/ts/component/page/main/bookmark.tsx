import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Header, FooterMainEdit as Footer, Loader, Block, Button, Deleted, Icon } from 'ts/component';
import { I, C, Util, crumbs, Action, analytics } from 'ts/lib';
import { blockStore, detailStore, menuStore, dbStore } from 'ts/store';

import HeadSimple from 'ts/component/page/head/simple';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

interface State {
	isDeleted: boolean;
};

const Errors = require('json/error.json');

const PageMainBookmark = observer(class PageMainBookmark extends React.Component<Props, State> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	refHead: any = null;
	loading: boolean = false;

	state = {
		isDeleted: false,
	};

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onReload = this.onReload.bind(this);
		this.onRelationAdd = this.onRelationAdd.bind(this);
	};

	render () {
		const { isDeleted } = this.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		if (isDeleted || object.isDeleted) {
			return <Deleted {...this.props} />;
		};
		if (this.loading) {
			return <Loader id="loader" />;
		};
		
		const blocks = blockStore.getBlocks(rootId, it => it.isRelation());
		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const allowedRelation = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);

		const ItemAdd = (item: any) => (
			<div id="item-add" className="item add" onClick={this.onRelationAdd}>
				<Icon className="plus" />
				<div className="name">Add relation</div>
			</div>
		);

		return (
			<div>
				<Header component="mainEdit" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				<div id="blocks" className="blocks wrapper">
					<HeadSimple ref={(ref: any) => { this.refHead = ref;}} type="bookmark" rootId={rootId} />

					<div className="buttons">
						<Button text="Open link" color="blank" onClick={this.onOpen} />
						{object.url ? <Button text="Reload data" color="blank" onClick={this.onReload} /> : ''}
					</div>

					<div className="section">
						{blocks.map((item: any) => (
							<Block {...this.props} key={item.id} rootId={rootId} block={item} />
						))}

						{allowedRelation ? <ItemAdd /> : ''}
					</div>
				</div>

				<Footer {...this.props} rootId={rootId} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
		this.resize();
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

			crumbs.addPage(rootId);
			crumbs.addRecent(rootId);

			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
			if (this.refHead) {
				this.refHead.forceUpdate();
			};
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

	onOpen (e: any) {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'url' ]);
		const renderer = Util.getRenderer();
	
		renderer.send('urlOpen', object.url);
	};

	onReload () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'url' ]);

		C.ObjectBookmarkFetch(rootId, object.url);
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	resize () {
		if (this.loading || !this._isMounted) {
			return;
		};
		
		const { isPopup } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const cover = node.find('.block.blockCover');
		const obj = $(isPopup ? '#popupPage #innerWrap' : '#page.isFull');
		const header = obj.find('#header');
		const hh = isPopup ? header.height() : Util.sizeHeader();

		if (cover.length) {
			cover.css({ top: hh });
		};

		node.css({ paddingTop: isPopup ? 0 : hh });
	};

	onRelationAdd (e: any) {
		const rootId = this.getRootId();
		const relations = dbStore.getRelations(rootId, rootId);

		menuStore.open('relationSuggest', { 
			element: $(e.currentTarget),
			offsetX: 0,
			data: {
				filter: '',
				rootId: rootId,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map((it: I.Relation) => { return it.relationKey; }),
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any, onChange?: (relation: any) => void) => {
					const param = {
						type: I.BlockType.Relation,
						content: { key: relation.relationKey }
					};

					C.BlockCreate(rootId, '', I.BlockPosition.Bottom, param, (message: any) => {
						C.BlockRelationSetKey(rootId, message.blockId, relation.relationKey, (message: any) => {
							if (onChange) {
								onChange(relation);
							};

							analytics.event('CreateBlock', { middleTime: message.middleTime, type: param.type });
						});
					});
				},
			}
		});
	};

});

export default PageMainBookmark;