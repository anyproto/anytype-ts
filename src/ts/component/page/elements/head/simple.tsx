import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Block, Button, Editable } from 'Component';
import { I, M, Action, UtilData, UtilObject, focus, keyboard, Relation, translate, UtilSpace } from 'Lib';
import { blockStore, detailStore, dbStore } from 'Store';
const Constant = require('json/constant.json');

interface Props {
	rootId: string;
	placeholder?: string;
	isContextMenuDisabled?: boolean;
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
	public static defaultProps = {
		placeholder: '',
	};

	constructor (props: Props) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onInstall = this.onInstall.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
	};

	render (): any {
		const { rootId, onCreate, isContextMenuDisabled } = this.props;
		const check = UtilData.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId, [ 'featuredRelations' ]);
		const featuredRelations = Relation.getArrayValue(object.featuredRelations);
		const allowDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const canWrite = UtilSpace.canMyParticipantWrite();

		const blockFeatured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const isTypeOrRelation = UtilObject.isTypeOrRelationLayout(object.layout);
		const isRelation = UtilObject.isRelationLayout(object.layout);
		const canEditIcon = allowDetails && !UtilObject.isRelationLayout(object.layout);
		const cn = [ 'headSimple', check.className ];
		const placeholder = {
			title: this.props.placeholder,
			description: translate('placeholderBlockDescription'),
		};

		const Editor = (item: any) => (
			<Editable
				ref={ref => this.refEditable[item.id] = ref}
				id={`editor-${item.id}`}
				placeholder={placeholder[item.id]}
				readonly={!allowDetails}
				classNameWrap={item.className}
				classNameEditor={[ 'focusable', 'c' + item.id ].join(' ')}
				classNamePlaceholder={'c' + item.id}
				onFocus={e => this.onFocus(e, item)}
				onBlur={e => this.onBlur(e, item)}
				onKeyDown={e => this.onKeyDown(e, item)}
				onKeyUp={() => this.onKeyUp()}
				onSelect={e => this.onSelectText(e, item)}
				onCompositionStart={this.onCompositionStart}
			/>
		);

		let button = null;
		let descr = null;
		let featured = null;

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
					readonly={!allowDetails}
					isContextMenuDisabled={isContextMenuDisabled}
				/>
			);
		};

		if (isTypeOrRelation) {
			if (object.isInstalled) {
				const text = isRelation ? translate('pageHeadSimpleCreateSet') : translate('commonCreate');
				const arrow = !isRelation;

				button = <Button id="button-create" className="c36" text={text} arrow={arrow} onClick={onCreate} />;
			} else {
				const cn = [ 'c36' ];
				const isInstalled = this.isInstalled();

				const onClick = isInstalled ? null : this.onInstall;
				const color = isInstalled ? 'blank' : 'black';

				if (isInstalled) {
					cn.push('disabled');
				};

				button = <Button id="button-install" text={translate('pageHeadSimpleInstall')} color={color} className={cn.join(' ')} onClick={onClick} />;
			};
		};

		if (!canWrite) {
			button = null;
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
		this.init();
	};

	componentDidUpdate () {
		this.init();
	};

	componentWillUnmount () {
		this._isMounted = false;

		focus.clear(true);
		window.clearTimeout(this.timeout);
	};

	init () {
		const { focused } = focus.state;
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId);

		this.setValue();

		if (!focused && !object._empty_ && (object.name == translate('defaultNamePage'))) {
			focus.set('title', { from: 0, to: 0 });
		};

		window.setTimeout(() => focus.apply(), 10);
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

	onUpload (objectId: string) {
		UtilObject.setIcon(this.props.rootId, '', objectId);
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
		this.timeout = window.setTimeout(() => this.save(), Constant.delay.keyboard);
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
			if (text == translate('defaultNamePage')) {
				text = '';
			};

			this.refEditable[item.blockId].setValue(text);
			this.placeholderCheck(item.blockId);
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

		Action.install(object, false, (message: any) => UtilObject.openAuto(message.details));
	};

	isInstalled () {
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId);

		let sources: string[] = [];

		switch (object.layout) {
			case I.ObjectLayout.Type: {
				sources = dbStore.getTypes().map(it => it.sourceObject);
				break;
			};

			case I.ObjectLayout.Relation: {
				sources = dbStore.getRelations().map(it => it.sourceObject);
				break;
			};
		};

		return sources.includes(rootId);
	};

});

export default HeadSimple;