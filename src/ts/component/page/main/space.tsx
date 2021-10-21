import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { IconObject, HeaderMainEdit as Header, FooterMainEdit as Footer, Loader, Block, ListObjectPreview } from 'ts/component';
import { I, M, C, DataUtil, Util, keyboard, focus, crumbs, Action } from 'ts/lib';
import { blockStore, detailStore, dbStore, menuStore } from 'ts/store';
import { getRange } from 'selection-ranges';

import Controls from 'ts/component/editor/controls';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const EDITOR_IDS = [ 'name', 'description' ];
const BLOCK_ID_HIGHLIGHTED = 'highlighted';

const PageMainSpace = observer(class PageMainSpace extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	loading: boolean = false;
	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render () {
		if (this.loading) {
			return <Loader id="loader" />;
		};

		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const check = DataUtil.checkDetails(rootId);
		const object = Util.objectCopy(detailStore.get(rootId, rootId, []));
		const block = blockStore.getLeaf(rootId, Constant.blockId.dataview) || {};
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const placeholder = {
			name: DataUtil.defaultName('set'),
			description: 'Add a description',
		};

		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, align: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const allowedDetails = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]);
		const highlighted = dbStore.getData(rootId, BLOCK_ID_HIGHLIGHTED);

		if (object.name == DataUtil.defaultName('page')) {
			object.name = '';
		};

		const Editor = (item: any) => {
			return (
				<div className={[ 'wrap', item.className ].join(' ')}>
					{!allowedDetails ? (
						<div id={'editor-' + item.id} className={[ 'editor', 'focusable', 'c' + item.id, 'isReadonly' ].join(' ')}>
							{object[item.id]}
						</div>
					) : (
						<React.Fragment>
							<div 
								id={'editor-' + item.id}
								className={[ 'editor', 'focusable', 'c' + item.id ].join(' ')}
								contentEditable={true}
								suppressContentEditableWarning={true}
								onFocus={(e: any) => { this.onFocus(e, item); }}
								onBlur={(e: any) => { this.onBlur(e, item); }}
								onKeyDown={(e: any) => { this.onKeyDown(e, item); }}
								onKeyUp={(e: any) => { this.onKeyUp(e, item); }}
								onInput={(e: any) => { this.onInput(e, item); }}
								onSelect={(e: any) => { this.onSelectText(e, item); }}
							>
								{object[item.id]}
							</div>
							<div className={[ 'placeholder', 'c' + item.id ].join(' ')}>{placeholder[item.id]}</div>
						</React.Fragment>
					)}
				</div>
			);
		};

		return (
			<div className={[ 'setWrapper', check.className ].join(' ')}>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

				{check.withCover ? <Block {...this.props} key={cover.id} rootId={rootId} block={cover} /> : ''}

				<div className="blocks wrapper">
					<Controls key="editorControls" {...this.props} rootId={rootId} />

					<div className="head">
						{check.withIcon ? (
							<div className="side left">
								<IconObject id={'icon-' + rootId} size={object.iconImage ? 112 : 96} object={object} canEdit={allowedDetails} onSelect={this.onSelect} onUpload={this.onUpload} />
							</div>
						) : ''}
						<div className={[ 'side', 'right', (object.iconImage ? 'big' : '') ].join(' ')}>
							<div className="txt">
								<Editor className="title" id="name" />
								<Editor className="descr" id="description" />

								<Block {...this.props} key={featured.id} rootId={rootId} iconSize={20} block={featured} />
							</div>
						</div>
					</div>

					<div className="section template">
						<div className="title">
							{highlighted.length} highlighted {Util.cntWord(highlighted.length, 'object', 'objects')}
						</div>
						{highlighted.length ? (
							<div className="content">
								<ListObjectPreview 
									key="listTemplate"
									items={highlighted}
									canAdd={false}
									onClick={(e: any, item: any) => { DataUtil.objectOpenPopup(item); }} 
								/>
							</div>
						) : (
							<div className="empty">
								This space doesn't have any highlighted objects
							</div>
						)}
					</div>
					
					<Block {...this.props} key={block.id} rootId={rootId} iconSize={20} block={block} />
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
		const { focused } = focus.state;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, []);

		this.open();

		for (let id of EDITOR_IDS) {
			this.placeholderCheck(id);
		};

		if (!focused && !object._empty_ && (object.name == DataUtil.defaultName('set'))) {
			focus.set('name', { from: 0, to: 0 });
		};

		window.setTimeout(() => { focus.apply(); }, 10);
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();

		focus.clear(true);
		window.clearTimeout(this.timeout);
	};

	open () {
		const { history } = this.props;
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.loading = true;
		this.forceUpdate();

		crumbs.addPage(rootId);
		crumbs.addRecent(rootId);

		C.BlockOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				history.push('/main/index');
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

	onSelect (icon: string) {
		const rootId = this.getRootId();
		DataUtil.pageSetIcon(rootId, icon, '');
	};

	onUpload (hash: string) {
		const rootId = this.getRootId();
		DataUtil.pageSetIcon(rootId, '', hash);
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
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map((it: I.Relation) => { return it.relationKey; }),
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationAdd(rootId, relation, () => { menuStore.close('relationSuggest'); });
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

	onFocus (e: any, item: any) {
		keyboard.setFocus(true);

		this.placeholderCheck(item.id);
	};

	onBlur (e: any, item: any) {
		keyboard.setFocus(false);
		window.clearTimeout(this.timeout);
		this.save();
	};

	onInput (e: any, item: any) {
		this.placeholderCheck(item.id);
	};

	onKeyDown (e: any, item: any) {
		this.placeholderCheck(item.id);

		if (item.id == 'name') {
			keyboard.shortcut('enter', e, (pressed: string) => {
				e.preventDefault();
			});
		};
	};

	onKeyUp (e: any, item: any) {
		this.placeholderCheck(item.id);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};

	onSelectText (e: any, item: any) {
		focus.set(item.id, this.getRange(item.id));
	};

	save () {
		const rootId = this.getRootId();
		const details = [];
		const object: any = { id: rootId };

		for (let id of EDITOR_IDS) {
			const value = this.getValue(id);

			details.push({ key: id, value: value });
			object[id] = value;
		};

		C.BlockSetDetails(rootId, details);
	};

	getRange (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('#editor-' + id).get(0) as Element);
		return range ? { from: range.start, to: range.end } : null;
	};

	getValue (id: string): string {
		if (!this._isMounted) {
			return '';
		};

		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#editor-' + id);

		return value.length ? String(value.get(0).innerText || '') : '';
	};

	placeholderCheck (id: string) {
		const value = this.getValue(id);
		value.length ? this.placeholderHide(id) : this.placeholderShow(id);			
	};

	placeholderHide (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeholder.c' + id).hide();
	};
	
	placeholderShow (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeholder.c' + id).show();
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
		const rootId = this.getRootId();
		const check = DataUtil.checkDetails(rootId);
		const node = $(ReactDOM.findDOMNode(this));
		const cover = node.find('.block.blockCover');
		const controls = node.find('.editorControls');
		const wrapper = node.find('.blocks.wrapper');
		const obj = $(isPopup ? '#popupPage #innerWrap' : '.page.isFull');
		const header = obj.find('#header');
		const hh = header.height();

		if (cover.length) {
			cover.css({ top: hh });
		};

		if (controls.length) {	
			controls.css({ top: hh, height: 128 - hh });
			wrapper.css({ paddingTop: 128 - hh + 10 });
		};

		if (check.withCover) {
			wrapper.css({ paddingTop: 330 });
		};

		obj.css({ minHeight: isPopup ? '' : win.height() });
		node.css({ paddingTop: hh });
	};

});

export default PageMainSpace;