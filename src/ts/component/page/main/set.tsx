import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { IconObject, HeaderMainEdit as Header, FooterMainEdit as Footer, Loader, Block } from 'ts/component';
import { I, M, C, DataUtil, Util, keyboard, focus, crumbs, Action } from 'ts/lib';
import { blockStore, detailStore, dbStore, menuStore } from 'ts/store';
import { getRange } from 'selection-ranges';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const EDITOR_IDS = [ 'name', 'description' ];

@observer
class PageMainSet extends React.Component<Props, {}> {

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
			return <Loader />;
		};

		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const object = Util.objectCopy(detailStore.get(rootId, rootId, []));
		const block = blockStore.getLeaf(rootId, Constant.blockId.dataview) || {};
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const placeHolder = {
			name: Constant.default.name,
			description: 'Add a description',
		};

		if (object.name == Constant.default.name) {
			object.name = '';
		};

		const Editor = (item: any) => {
			return (
				<div className={[ 'wrap', item.className ].join(' ')}>
					<div 
						id={'editor-' + item.id}
						className={[ 'editor', 'focusable', 'c' + item.id ].join(' ')}
						contentEditable={true}
						suppressContentEditableWarning={true}
						onFocus={(e: any) => { this.onFocus(e, item); }}
						onBlur={(e: any) => { this.onBlur(e, item); }}
						onKeyUp={(e: any) => { this.onKeyUp(e, item); }}
						onInput={(e: any) => { this.onInput(e, item); }}
						onSelect={(e: any) => { this.onSelectText(e, item); }}
					>
						{object[item.id]}
					</div>
					<div className={[ 'placeHolder', 'c' + item.id ].join(' ')}>{placeHolder[item.id]}</div>
				</div>
			);
		};

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} isPopup={isPopup} />

				<div className="blocks wrapper">
					<div className="head">
						<div className="side left">
							<IconObject id={'icon-' + rootId} size={96} object={object} canEdit={true} onSelect={this.onSelect} onUpload={this.onUpload} />
						</div>
						<div className="side right">
							<Editor className="title" id="name" />
							<Editor className="descr" id="description" />

							<Block {...this.props} key={featured.id} rootId={rootId} iconSize={20} block={featured} />
						</div>
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
		this.open();

		for (let id of EDITOR_IDS) {
			this.placeHolderCheck(id);
		};

		window.setTimeout(() => { focus.apply(); }, 10);
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

		crumbs.addCrumbs(rootId);
		crumbs.addRecent(rootId);

		C.BlockOpen(rootId, (message: any) => {
			if (message.error.code) {
				history.push('/main/index');
				return;
			};

			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
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
			Action.pageClose(rootId);
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
			offsetY: 4,
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
			offsetY: 4,
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				relationKey: relationKey,
				readOnly: false,
				updateCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationUpdate(rootId, relation);
				},
			}
		});
	};

	onFocus (e: any, item: any) {
		keyboard.setFocus(true);

		this.placeHolderCheck(item.id);
	};

	onBlur (e: any, item: any) {
		keyboard.setFocus(false);
		window.clearTimeout(this.timeout);
		this.save();
	};

	onInput (e: any, item: any) {
		this.placeHolderCheck(item.id);
	};

	onKeyUp (e: any, item: any) {
		this.placeHolderCheck(item.id);

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

	placeHolderCheck (id: string) {
		const value = this.getValue(id);
		value.length ? this.placeHolderHide(id) : this.placeHolderShow(id);			
	};

	placeHolderHide (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder.c' + id).hide();
	};
	
	placeHolderShow (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder.c' + id).show();
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

};

export default PageMainSet;