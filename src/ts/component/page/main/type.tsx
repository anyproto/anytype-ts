import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, IconObject, HeaderMainEdit as Header, Loader, Block } from 'ts/component';
import { I, M, C, DataUtil, Util, keyboard, focus, crumbs } from 'ts/lib';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { getRange } from 'selection-ranges';

interface Props extends RouteComponentProps<any> {
	isPopup?: boolean;
};

const $ = require('jquery');
const BLOCK_ID = 'dataview';
const EDITOR_IDS = [ 'name', 'description' ];
const Constant = require('json/constant.json');

@observer
class PageMainType extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	loading: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render () {
		if (this.loading) {
			return <Loader />;
		};

		const { config } = commonStore;
		const { match, isPopup } = this.props;
		const rootId = match.params.id;
		const object = blockStore.getDetails(rootId, rootId);
		const block = blockStore.getLeaf(rootId, BLOCK_ID) || {};
		const meta = dbStore.getMeta(rootId, block.id);
		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const placeHolder = {
			name: Constant.default.nameType,
			description: 'Add description',
		};

		let relations = Util.objectCopy(dbStore.getRelations(rootId, rootId)).sort(DataUtil.sortByName);
		if (!config.debug.ho) {
			relations = relations.filter((it: any) => { return !it.isHidden; });
		};

		if (this.isDefaultName() || (object.name == Constant.default.name)) {
			object.name = '';
		};

		let data = dbStore.getData(rootId, block.id).map((it: any) => {
			it.name = String(it.name || Constant.default.name || '');
			return it;
		});

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

		const Relation = (item: any) => (
			<div className={[ 'item', (item.isHidden ? 'isHidden' : '') ].join(' ')}>
				<div className="clickable" onClick={(e: any) => { this.onEdit(e, item.relationKey); }}>
					<Icon className={[ 'relation', DataUtil.relationClass(item.format) ].join(' ')} />
					<div className="name">{item.name}</div>
				</div>
				<div className="value" />
			</div>
		);

		const ItemAdd = (item: any) => (
			<div id="item-add" className="item add" onClick={(e: any) => { this.onAdd(e); }}>
				<div className="clickable">
					<Icon className="plus" />
					<div className="name">New</div>
				</div>
				<div className="value" />
			</div>
		);

		const Row = (item: any) => {
			const author = blockStore.getDetails(rootId, item.creator);
			return (
				<tr className={[ 'row', (item.isHidden ? 'isHidden' : '') ].join(' ')}>
					<td className="cell">
						<div className="cellContent cp" onClick={(e: any) => { DataUtil.objectOpenEvent(e, item); }}>
							<IconObject object={item} />
							<div className="name">{item.name}</div>
						</div>
					</td>
					<td className="cell">
						{item.lastModifiedDate ? (
							<div className="cellContent">
								{Util.date(DataUtil.dateFormat(I.DateFormat.MonthAbbrBeforeDay), item.lastModifiedDate)}
							</div>
						) : ''}
					</td>
					<td className="cell">
						{!author._objectEmpty_ ? (
							<div className="cellContent cp" onClick={(e: any) => { DataUtil.objectOpenEvent(e, author); }}>
								<IconObject object={author} />
								<div className="name">{author.name}</div>
							</div>
						) : ''}
					</td>
				</tr>
			);
		};

		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} isPopup={isPopup} />

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
					
					<div className="section note dn">
						<div className="title">Notes</div>
						<div className="content">People often distinguish between an acquaintance and a friend, holding that the former should be used primarily to refer to someone with whom one is not especially close. Many of the earliest uses of acquaintance were in fact in reference to a person with whom one was very close, but the word is now generally reserved for those who are known only slightly.</div>
					</div>

					<div className="section relation">
						<div className="title">Recommended relations</div>
						<div className="content">
							{relations.map((item: any, i: number) => (
								<Relation key={i} {...item} />
							))}
							<ItemAdd />
						</div>
					</div>

					<div className="section set">
						<div className="title">Set of objects</div>
						<div className="content">
							<table>
								<thead>
									<tr className="row">
										<th className="cellHead">
											<div className="name">Name</div>
										</th>
										<th className="cellHead">
											<div className="name">Updated</div>
										</th>
										<th className="cellHead">
											<div className="name">Owner</div>
										</th>
									</tr>
								</thead>
								<tbody>
									{!data.length ? (
										<tr>
											<td className="cell empty" colSpan={3}>No objects yet</td>
										</tr>
									) : (
										<React.Fragment>
											{data.map((item: any, i: number) => (
												<Row key={i} {...item} />
											))}
										</React.Fragment>
									)}
								</tbody>
							</table>
						</div>
					</div>
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

		for (let id of EDITOR_IDS) {
			this.placeHolderCheck(id);
		};

		if (this.isDefaultName()) {
			focus.set('name', { from: 0, to: 0 });
		};

		window.setTimeout(() => { focus.apply(); }, 10);
	};

	componentWillUnmount () {
		this._isMounted = false;
		focus.clear(true);
	};

	isDefaultName () {
		const { match } = this.props;
		const rootId = match.params.id;
		const object = blockStore.getDetails(rootId, rootId);

		return [ Constant.default.nameType ].indexOf(object.name) >= 0;
	};

	open () {
		const { match, history } = this.props;
		const rootId = match.params.id;

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

	onSelect (icon: string) {
		const { match } = this.props;
		const rootId = match.params.id;

		DataUtil.pageSetIcon(rootId, icon, '');
	};

	onUpload (hash: string) {
		const { match } = this.props;
		const rootId = match.params.id;

		DataUtil.pageSetIcon(rootId, '', hash);
	};

	onAdd (e: any) {
		const { match } = this.props;
		const rootId = match.params.id;
		const relations = dbStore.getRelations(rootId, rootId);

		commonStore.menuOpen('relationSuggest', { 
			type: I.MenuType.Vertical,
			element: $(e.currentTarget),
			offsetX: 32,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				filter: '',
				rootId: rootId,
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map((it: I.Relation) => { return it.relationKey; }),
				listCommand: (rootId: string, blockId: string, callBack?: (message: any) => void) => {
					C.ObjectRelationListAvailable(rootId, callBack);
				},
				addCommand: (rootId: string, blockId: string, relation: any) => {
					C.ObjectRelationAdd(rootId, relation, () => { commonStore.menuClose('relationSuggest'); });
				},
			}
		});
	};

	onEdit (e: any, relationKey: string) {
		const { match } = this.props;
		const rootId = match.params.id;
		
		commonStore.menuOpen('blockRelationEdit', { 
			type: I.MenuType.Vertical,
			element: $(e.currentTarget),
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
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
		this.save();
	};

	onInput (e: any, item: any) {
		this.placeHolderCheck(item.id);
	};

	onKeyUp (e: any, item: any) {
		this.placeHolderCheck(item.id);
		this.save();
	};

	onSelectText (e: any, item: any) {
		focus.set(item.id, this.getRange(item.id));
	};

	save () {
		const { match } = this.props;
		const rootId = match.params.id;
		const details = [];

		for (let id of EDITOR_IDS) {
			details.push({ key: id, value: this.getValue(id) });
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

};

export default PageMainType;