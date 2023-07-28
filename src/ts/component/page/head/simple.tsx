import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Block, Button, Editable } from 'Component';
import { I, M, Action, UtilData, UtilObject, focus, keyboard, Relation, translate } from 'Lib';
import { blockStore, detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	rootId: string;
	type: string;
	onCreate?: () => void;
};

const EDITORS = [ 
	{ relationKey: 'name', blockId: 'title' }, 
	{ relationKey: 'description', blockId: 'description' },
];

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
		const check = UtilData.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId, [ 'featuredRelations' ]);
		const featuredRelations = Relation.getArrayValue(object.featuredRelations);
		const allowDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const placeholder = {
			title: UtilObject.defaultName(type),
			description: translate('placeholderBlockDescription'),
		};

		const blockFeatured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const isTypeOrRelation = [ 
			Constant.typeId.type, 
			Constant.storeTypeId.type, 
			Constant.typeId.relation, 
			Constant.storeTypeId.relation,
		].includes(object.type);

		let canEditIcon = allowDetails;
		if (object.type == Constant.typeId.relation) {
			canEditIcon = false;
		};

		const Editor = (item: any) => (
			<Editable
				ref={ref => this.refEditable[item.id] = ref}
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

		let button = null;
		let descr = null;
		let featured = null;
		let cn = [ 'headSimple', check.className ];

		if (!isTypeOrRelation) {
			if (featuredRelations.includes('description')) {
				descr = <Editor className="descr" id="description" />;
			};
			featured = (
				<Block 
					{...this.props} 
					key={blockFeatured.id} 
					rootId={rootId} 
					iconSize={20} 
					block={blockFeatured} 
					className="small" 
					isSelectionDisabled={true}
				/>
			);
		};

		if ([ Constant.typeId.type, Constant.typeId.relation ].includes(object.type)) {
			let text = translate('commonCreate');
			let arrow = false;

			if (object.type == Constant.typeId.relation) {
				text = translate('pageHeadSimpleCreateSet');
			} else {
				arrow = true;
			};

			button = <Button id="button-create" className="c36" text={text} arrow={arrow} onClick={onCreate} />;
		};

		if (UtilObject.isStoreType(object.type)) {
			const cn = [ 'c36' ];
			const isInstalled = this.isInstalled();

			let onClick = isInstalled ? null : this.onInstall;
			let color = isInstalled ? 'blank' : 'black';

			if (isInstalled) {
				cn.push('disabled');
			};

			button = <Button id="button-install" text={translate('pageHeadSimpleInstall')} color={color} className={cn.join(' ')} onClick={onClick} />;
		};

		return (
			<div ref={node => this.node = node} className={cn.join(' ')}>
				<div className="side left">
					<div className="titleWrap">
						{check.withIcon ? (
							<IconObject 
								id={'block-icon-' + rootId} 
								size={32} 
								iconSize={32}
								object={object} 
								forceLetter={true}
								canEdit={canEditIcon} 
								onSelect={this.onSelect} 
								onUpload={this.onUpload} 
							/>
						) : ''}
						<Editor className="title" id="title" />
					</div>

					{descr}
					{featured}
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
		const object = detailStore.get(rootId, rootId);

		this.setValue();

		for (let item of EDITORS) {
			this.placeholderCheck(item.blockId);
		};

		if (!focused && !object._empty_ && (object.name == UtilObject.defaultName('Page'))) {
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
		UtilObject.setIcon(rootId, icon, '');
	};

	onUpload (hash: string) {
		const { rootId } = this.props;
		UtilObject.setIcon(rootId, '', hash);
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

		for (const item of EDITORS) {
			UtilData.blockSetText(rootId, item.blockId, this.getValue(item.blockId), [], true);
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
		const object = detailStore.get(rootId, rootId);

		for (const item of EDITORS) {
			if (!this.refEditable[item.blockId]) {
				continue;
			};

			let text = String(object[item.relationKey] || '');
			if (text == UtilObject.defaultName('Page')) {
				text = '';
			};

			this.refEditable[item.blockId].setValue(text);
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

		Action.install(object, false, (message: any) => {
			UtilObject.openAuto(message.details);
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