import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IconObject, Block, Button } from 'ts/component';
import { I, M, DataUtil, focus, keyboard } from 'ts/lib';
import { blockStore, detailStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';

interface Props {
	rootId: string;
	type: string;
	onCreate?: () => void;
};

const Constant = require('json/constant.json');
const EDITOR_IDS = [ 'title', 'description' ];

const HeadSimple = observer(class Controls extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;
	composition: boolean = false;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render (): any {
		const { rootId, type, onCreate } = this.props;
		const check = DataUtil.checkDetails(rootId);
		const object = check.object;
		const allowDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowCreate = rootId != Constant.typeId.set;
		const placeholder = {
			title: DataUtil.defaultName(type),
			description: 'Add a description',
		};

		const featured: any = new M.Block({ id: rootId + '-featured', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });

		const Editor = (item: any) => {
			return (
				<div className={[ 'wrap', item.className ].join(' ')}>
					{!allowDetails ? (
						<div id={'editor-' + item.id} className={[ 'editor', 'focusable', 'c' + item.id, 'isReadonly' ].join(' ')} />
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
								onCompositionStart={this.onCompositionStart}
								onCompositionEnd={this.onCompositionEnd}
							/>
							<div className={[ 'placeholder', 'c' + item.id ].join(' ')}>{placeholder[item.id]}</div>
						</React.Fragment>
					)}
				</div>
			);
		};

		let button = null;
		if (allowCreate && (object.type == Constant.typeId.type)) {
			button = <Button id="button-create" text="Create" onClick={onCreate} />;
		};
		if (object.type == Constant.typeId.relation) {
			button = <Button id="button-create" text="Create set" onClick={onCreate} />;
		};

		return (
			<div className="headSimple">
				{check.withIcon ? (
					<div className="side left">
						<IconObject id={'block-icon-' + rootId} size={object.iconImage ? 112 : 96} object={object} canEdit={allowDetails} onSelect={this.onSelect} onUpload={this.onUpload} />
					</div>
				) : ''}

				<div className={[ 'side', 'center', (object.iconImage ? 'big' : '') ].join(' ')}>
					<div className="txt">
						<Editor className="title" id="title" />
						<Editor className="descr" id="description" />

						<Block {...this.props} key={featured.id} rootId={rootId} iconSize={20} block={featured} className="small" />
					</div>
				</div>

				{button ? (
					<div className="side right">{button}</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		const { focused } = focus.state;
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId, []);

		this.setValue();

		for (let id of EDITOR_IDS) {
			this.placeholderCheck(id);
		};

		if (!focused && !object._empty_ && (object.name == DataUtil.defaultName('page'))) {
			focus.set('title', { from: 0, to: 0 });
		};

		window.setTimeout(() => { focus.apply(); }, 10);
	};

	componentWillUnmount () {
		this._isMounted = false;

		focus.clear(true);
		window.clearTimeout(this.timeout);
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

	onSelect (icon: string) {
		const { rootId } = this.props;
		DataUtil.pageSetIcon(rootId, icon, '');
	};

	onUpload (hash: string) {
		const { rootId } = this.props;
		DataUtil.pageSetIcon(rootId, '', hash);
	};

	onKeyDown (e: any, item: any) {
		this.placeholderCheck(item.id);

		if (item.id == 'title') {
			keyboard.shortcut('enter', e, (pressed: string) => {
				e.preventDefault();
			});
		};
	};

	onKeyUp (e: any, item: any) {
		if (this.composition) {
			return;
		};

		this.placeholderCheck(item.id);

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};

	onSelectText (e: any, item: any) {
		focus.set(item.id, this.getRange(item.id));
	};

	onCompositionStart (e: any) {
		this.composition = true;
		window.clearTimeout(this.timeout);
	};

	onCompositionEnd (e: any) {
		this.composition = false;
	};

	save () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const update: any = {};

		for (let id of EDITOR_IDS) {
			const value = this.getValue(id);
			DataUtil.blockSetText(rootId, id, value, [], true);
			update[id] = value;
		};
	};

	getRange (id: string) {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('#editor-' + id).get(0) as Element);
		return range ? { from: range.start, to: range.end } : null;
	};

	setValue () {
		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));

		for (let id of EDITOR_IDS) {
			const item = node.find(`#editor-${id}`);
			const block = blockStore.getLeaf(rootId, id);

			if (block) {
				let text = block.content.text;
				if (text == DataUtil.defaultName('page')) {
					text = '';
				};
				item.text(text);
			};
		};
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

});

export default HeadSimple;