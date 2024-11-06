import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Block, Button, Editable } from 'Component';
import { I, M, S, U, J, Action, focus, keyboard, Relation, translate } from 'Lib';

interface Props {
	rootId: string;
	placeholder?: string;
	isContextMenuDisabled?: boolean;
	readonly?: boolean;
	noIcon?: boolean;
	withColorPicker?: boolean;
	colorPickerTitle?: string;
	onCreate?: () => void;
	onColorChange?: (color: string) => void;
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

		this.onInstall = this.onInstall.bind(this);
		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onColorPicker = this.onColorPicker.bind(this);
	};

	render (): any {
		const { rootId, onCreate, isContextMenuDisabled, readonly, noIcon, withColorPicker } = this.props;
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, [ 'featuredRelations' ]);
		const featuredRelations = Relation.getArrayValue(object.featuredRelations);
		const allowDetails = !readonly && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const canWrite = U.Space.canMyParticipantWrite();
		const theme = S.Common.getThemeClass();

		const blockFeatured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
		const isRelation = U.Object.isRelationLayout(object.layout);
		const canEditIcon = allowDetails && !U.Object.isRelationLayout(object.layout);
		const cn = [ 'headSimple', check.className ];
		const titleCn = [ 'title' ];
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

		if (withColorPicker) {
			cn.push('withColorPicker');
			titleCn.push(`isMultiSelect`);
			titleCn.push(`tagColor-${object.color || 'default'}`);
		};

		return (
			<div ref={node => this.node = node} className={cn.join(' ')}>
				<div className="side left">
					<div className="titleWrap">
						{!noIcon && check.withIcon ? (
							<IconObject 
								id={'block-icon-' + rootId} 
								size={32} 
								iconSize={32}
								object={object} 
								canEdit={canEditIcon} 
							/>
						) : ''}
						<Editor className={titleCn.join(' ')} id="title" />

						{withColorPicker ? (
							<div
								id="colorPicker"
								style={{ background: J.Theme[theme].color[object.color || 'default']}}
								className="colorPicker"
								onClick={this.onColorPicker}
							/>
						) : ''}
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
		const object = S.Detail.get(rootId, rootId);

		this.setValue();

		if (!focused && !object._empty_ && (object.name == translate('defaultNamePage'))) {
			focus.set('title', { from: 0, to: 0 });
		};

		window.setTimeout(() => focus.apply(), 10);
	};

	onFocus (e: any, item: any) {
		this.placeholderCheck(item.id);
	};

	onBlur (e: any, item: any) {
		window.clearTimeout(this.timeout);
		this.save();
	};

	onKeyDown (e: any, item: any) {
		if (item.id == 'title') {
			keyboard.shortcut('enter', e, () => e.preventDefault());
		};
	};

	onKeyUp () {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.save(), J.Constant.delay.keyboard);
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
			U.Data.blockSetText(rootId, item.blockId, this.getValue(item.blockId), [], true);
		};
	};

	getRange (id: string): I.TextRange {
		return this.refEditable[id]?.getRange();
	};

	getValue (id: string): string {
		const value = String(this.refEditable[id]?.getTextValue() || '');
		return U.Common.stripTags(value);
	};

	setValue () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId);

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
		const object = S.Detail.get(rootId, rootId);

		Action.install(object, false, (message: any) => U.Object.openAuto(message.details));
	};

	isInstalled () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId);

		let sources: string[] = [];

		switch (object.layout) {
			case I.ObjectLayout.Type: {
				sources = S.Record.getTypes().map(it => it.sourceObject);
				break;
			};

			case I.ObjectLayout.Relation: {
				sources = S.Record.getRelations().map(it => it.sourceObject);
				break;
			};
		};

		return sources.includes(rootId);
	};

	onColorPicker () {
		const { rootId, onColorChange, colorPickerTitle } = this.props;
		const object = S.Detail.get(rootId, rootId);

		S.Menu.open('dataviewOptionEdit', {
			element: `#colorPicker`,
			offsetY: 4,
			title: colorPickerTitle || translate('commonColor'),
			data: {
				option: { color: object.color },
				onColorPick: (color) => {
					if (onColorChange) {
						onColorChange(color);
					};
				},
				noFilter: true,
				noRemove: true
			}
		});
	};

});

export default HeadSimple;
