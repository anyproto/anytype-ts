import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Block, Button, Editable, Icon } from 'Component';
import { I, M, S, U, J, Action, focus, keyboard, Relation, translate, analytics } from 'Lib';

interface Props {
	rootId: string;
	placeholder?: string;
	isContextMenuDisabled?: boolean;
	readonly?: boolean;
	noIcon?: boolean;
	relationKey?: string;
	onCreate?: () => void;
	getDotMap?: (start: number, end: number, callback: (res: Map<string, boolean>) => void) => void;
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
	};

	render (): any {
		const { rootId, onCreate, isContextMenuDisabled, readonly, noIcon } = this.props;
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, [ 'featuredRelations' ]);
		const featuredRelations = Relation.getArrayValue(object.featuredRelations);
		const allowDetails = !readonly && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const canWrite = U.Space.canMyParticipantWrite();

		const blockFeatured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
		const isDate = U.Object.isDateLayout(object.layout);
		const isRelation = U.Object.isRelationLayout(object.layout);
		const canEditIcon = allowDetails && !U.Object.isRelationLayout(object.layout);
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

		let button: React.ReactElement = null;
		let descr = null;
		let featured = null;

		if (!isTypeOrRelation && !isDate) {
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

			if (!canWrite) {
				button = null;
			};
		};

		if (isDate) {
			button = (
				<React.Fragment>
					<Icon className="arrow left withBackground" onClick={() => this.changeDate(-1)} />
					<Icon className="arrow right withBackground" onClick={() => this.changeDate(1)}/>
					<Icon id="calendar-icon" className="calendar withBackground" onClick={this.onCalendar} />
				</React.Fragment>
			);
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
		const object = S.Detail.get(rootId, rootId, [ 'name' ], true);

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
		const { dateFormat } = S.Common;
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, []);

		for (const item of EDITORS) {
			if (!this.refEditable[item.blockId]) {
				continue;
			};

			let text = String(object[item.relationKey] || '');

			if (U.Object.isDateLayout(object.layout) && object.timestamp) {
				text = U.Date.dateWithFormat(dateFormat, object.timestamp);
			};

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

		let sources: any[] = [];

		switch (object.layout) {
			case I.ObjectLayout.Type: {
				sources = S.Record.getTypes();
				break;
			};

			case I.ObjectLayout.Relation: {
				sources = S.Record.getRelations();
				break;
			};
		};

		return sources.map(it => it.sourceObject).includes(rootId);
	};

	onCalendar = () => {
		const { rootId, getDotMap, relationKey } = this.props;
		const object = S.Detail.get(rootId, rootId);

		S.Menu.open('dataviewCalendar', {
			element: '#calendar-icon',
			horizontal: I.MenuDirection.Center,
			data: {
				value: object.timestamp,
				canEdit: true,
				canClear: false,
				relationKey,
				onChange: (value: number) => U.Object.openDateByTimestamp(relationKey, value),
				getDotMap,
			},
		});

		analytics.event('ClickDateCalendarView');
	};

	changeDate = (dir: number) => {
		const { rootId, relationKey } = this.props;
		const object = S.Detail.get(rootId, rootId);

		U.Object.openDateByTimestamp(relationKey, object.timestamp + dir * 86400);
		analytics.event(dir > 0 ? 'ClickDateForward' : 'ClickDateBack');
	};

});

export default HeadSimple;