import * as React from 'react';
import { observer } from 'mobx-react';
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

const HeadSimple = observer(class Controls extends React.Component<Props> {
	
	_isMounted = false;
	refEditable: any = {};
	node: any = null;
	timeout = 0;

	constructor (props: Props) {
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
		const canEditIcon = allowDetails && (object.type != Constant.typeId.relation);
		const placeholder = {
			title: DataUtil.defaultName(type),
			description: 'Add a description',
		};
		const blockFeatured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const isTypeOrRelation = [ 
			Constant.typeId.type, 
			Constant.storeTypeId.type, 
			Constant.typeId.relation, 
			Constant.storeTypeId.relation,
		].includes(object.type);


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
					onKeyUp={() => { this.onKeyUp(); }}
					onSelect={(e: any) => { this.onSelectText(e, item); }}
					onCompositionStart={this.onCompositionStart}
				/>
			);
		};

		let button = null;
		let size = null;
		let iconSize = null;
		let descr = null;
		let featured = null;
		let cn = [ 'headSimple', check.className ];

		if (isTypeOrRelation) {
			size = 32;
			iconSize = 28;
		} else {
			size = 96;

			if (object.iconImage) {
				size = 112;
				cn.push('isBig');
			};

			descr = <Editor className="descr" id="description" />;
			featured = <Block {...this.props} key={blockFeatured.id} rootId={rootId} iconSize={20} block={blockFeatured} className="small" />;
		};

		if ([ Constant.typeId.type, Constant.typeId.relation ].includes(object.type)) {
			let text = 'Create';
			let arrow = false;

			if (object.type == Constant.typeId.relation) {
				text = 'Create set';
			} else {
				arrow = true;
			};

			button = <Button id="button-create" color="black" text={text} arrow={arrow} onClick={onCreate} />;
		};

		if ([ Constant.storeTypeId.type, Constant.storeTypeId.relation ].includes(object.type)) {
			let onClick = null;
			let className = '';

			if (this.isInstalled()) {
				className = 'grey filled disabled';
			} else {
				onClick = this.onInstall;
			};

			button = <Button id="button-install" color="black" text="Install" className={className} onClick={onClick} />;
		};

		return (
			<div ref={node => this.node = node} className={cn.join(' ')}>
				{check.withIcon ? (
					<div className="side left">
						<IconObject 
							id={'block-icon-' + rootId} 
							size={size} 
							iconSize={iconSize}
							object={object} 
							canEdit={canEditIcon} 
							onSelect={this.onSelect} 
							onUpload={this.onUpload} 
						/>
					</div>
				) : ''}

				<div className="side center">
					<div className="txt">
						<Editor className="title" id="title" />
						{descr}
						{featured}
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

	onKeyUp () {
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