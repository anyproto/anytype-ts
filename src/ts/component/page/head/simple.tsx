import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { IconObject, Block, Button, Editable } from 'Component';
import { I, M, Action, DataUtil, ObjectUtil, focus, keyboard } from 'Lib';
import { blockStore, detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	rootId: string;
	type: string;
	onCreate?: () => void;
};

const EDITOR_IDS = [ 'title', 'description' ];

const HeadSimple = observer(class Controls extends React.Component<Props, object> {
	
	_isMounted: boolean = false;
	refEditable: any = {};
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onInstall = this.onInstall.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
	};

	render (): any {
		const { rootId, type, onCreate } = this.props;
		const check = DataUtil.checkDetails(rootId);
		const object = check.object;
		const allowDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const placeholder = {
			title: DataUtil.defaultName(type),
			description: 'Add a description',
		};
		const featured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });

		let canEditIcon = allowDetails;
		if (object.type == Constant.typeId.relation) {
			canEditIcon = false;
		};

		const Editor = (item: any) => {
			return (
				<Editable
					ref={(ref: any) => { this.refEditable[item.id] = ref; }}
					id={'editor-' + item.id}
					placeholder={placeholder[item.id]}
					readonly={!allowDetails}
					classNameWrap={item.className}
					classNameEditor={[ 'focusable', 'c' + item.id ].join(' ')}
					classNamePlaceholder={'c' + item.id}
					onFocus={(e: any) => { this.onFocus(e, item); }}
					onBlur={(e: any) => { this.onBlur(e, item); }}
					onKeyDown={(e: any) => { this.onKeyDown(e, item); }}
					onKeyUp={(e: any) => { this.onKeyUp(e, item); }}
					onSelect={(e: any) => { this.onSelectText(e, item); }}
					onCompositionStart={this.onCompositionStart}
				/>
			);
		};

		let button = null;
		if (object.type == Constant.typeId.type) {
			button = <Button id="button-create" text="Create" onClick={onCreate} />;
		};
		if (object.type == Constant.typeId.relation) {
			button = <Button id="button-create" text="Create set" onClick={onCreate} />;
		};
		if ([ Constant.storeTypeId.type, Constant.storeTypeId.relation ].includes(object.type)) {
			if (this.isInstalled()) {
				button = <Button id="button-install" text="Install" className="grey filled disabled" />;
			} else {
				button = <Button id="button-install" text="Install" onClick={this.onInstall} />;
			};
		};

		return (
			<div className="headSimple">
				{check.withIcon ? (
					<div className="side left">
						<IconObject id={'block-icon-' + rootId} size={object.iconImage ? 112 : 96} object={object} canEdit={canEditIcon} onSelect={this.onSelect} onUpload={this.onUpload} />
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

	onSelect (icon: string) {
		const { rootId } = this.props;
		ObjectUtil.setIcon(rootId, icon, '');
	};

	onUpload (hash: string) {
		const { rootId } = this.props;
		ObjectUtil.setIcon(rootId, '', hash);
	};

	onKeyDown (e: any, item: any) {
		if (item.id == 'title') {
			keyboard.shortcut('enter', e, (pressed: string) => {
				e.preventDefault();
			});
		};
	};

	onKeyUp (e: any, item: any) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.save(); }, 500);
	};

	onSelectText (e: any, item: any) {
		focus.set(item.id, this.getRange(item.id));
	};

	onCompositionStart (e: any) {
		window.clearTimeout(this.timeout);
	};

	save () {
		const { rootId } = this.props;
		for (let id of EDITOR_IDS) {
			DataUtil.blockSetText(rootId, id, this.getValue(id), [], true);
		};
	};

	getRange (id: string): I.TextRange {
		return this.refEditable[id] ? this.refEditable[id].getRange() : null;
	};

	getValue (id: string): string {
		return this.refEditable[id] ? this.refEditable[id].getTextValue() : null;
	};

	setValue () {
		const { rootId } = this.props;

		for (let id of EDITOR_IDS) {
			const block = blockStore.getLeaf(rootId, id);
			if (!block || !this.refEditable[id]) {
				continue;
			};

			let text = block.content.text;
			if (text == DataUtil.defaultName('page')) {
				text = '';
			};

			this.refEditable[id].setValue(text);
		};
	};

	placeholderCheck (id: string) {
		if (this.refEditable[id]) {
			this.refEditable[id].placeholderCheck();
		};		
	};

	placeholderHide (id: string) {
		if (this.refEditable[id]) {
			this.refEditable[id].placeholderHide();
		};
	};
	
	placeholderShow (id: string) {
		if (this.refEditable[id]) {
			this.refEditable[id].placeholderShow();
		};
	};

	onInstall () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId);

		Action.install(object, (message: any) => {
			ObjectUtil.openAuto(message.details);
		});
	};

	isInstalled () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId);

		let sources: string[] = [];

		switch (object.type) {
			case Constant.storeTypeId.type:
				sources = dbStore.getTypes().map(it => it.sourceObject);
				break;

			case Constant.storeTypeId.relation:
				sources = dbStore.getRelations().map(it => it.sourceObject);
				break;
		};

		return sources.includes(rootId);
	};

});

export default HeadSimple;