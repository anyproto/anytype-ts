import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Block, Button, Editable, Icon } from 'Component';
import { I, M, S, U, J, C, Action, focus, keyboard, Relation, translate, analytics, sidebar, Dataview } from 'Lib';

interface Props {
	rootId: string;
	placeholder?: string;
	isContextMenuDisabled?: boolean;
	readonly?: boolean;
	noIcon?: boolean;
	relationKey?: string;
	isPopup?: boolean;
	onCreate?: () => void;
	getDotMap?: (start: number, end: number, callback: (res: Map<string, boolean>) => void) => void;
};

const EDITORS = [ 
	{ relationKey: 'name', blockId: 'title' }, 
	{ relationKey: 'description', blockId: 'description' },
];

const SUB_ID_CHECK = 'headSimple-check';

const HeadSimple = observer(class HeadSimple extends React.Component<Props> {
	
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
		this.onTemplates = this.onTemplates.bind(this);
	};

	render (): any {
		const { rootId, isContextMenuDisabled, readonly, noIcon, isPopup } = this.props;
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, [ 'featuredRelations', 'recommendedLayout', 'pluralName' ]);
		const featuredRelations = Relation.getArrayValue(object.featuredRelations);
		const allowDetails = !readonly && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const canWrite = U.Space.canMyParticipantWrite();
		const blockFeatured: any = new M.Block({ id: 'featuredRelations', type: I.BlockType.Featured, childrenIds: [], fields: {}, content: {} });
		const isTypeOrRelation = U.Object.isTypeOrRelationLayout(check.layout);
		const isType = U.Object.isTypeLayout(check.layout);
		const isDate = U.Object.isDateLayout(object.layout);
		const isRelation = U.Object.isRelationLayout(object.layout);
		const cn = [ 'headSimple', check.className ];
		const canEditIcon = allowDetails && !isRelation && !isType;
		const isOwner = U.Space.isMyOwner();
		const total = S.Record.getMeta(SUB_ID_CHECK, '').total;

		if (!allowDetails) {
			cn.push('isReadonly');
		};

		const placeholder = {
			title: this.props.placeholder,
			description: translate('commonDescription'),
		};
		const buttons = [];

		const Editor = (item: any) => (
			<Editable
				ref={ref => this.refEditable[item.id] = ref}
				id={`editor-${item.id}`}
				placeholder={placeholder[item.id]}
				readonly={item.readonly}
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

		let buttonLayout = null;
		let buttonEdit = null;
		let buttonCreate = null;
		let buttonTemplate = null;
		let descr = null;
		let featured = null;

		if (!isRelation && featuredRelations.includes('description')) {
			descr = <Editor className="descr" id="description" readonly={!allowDetails} />;
		};

		if (!isDate && !isTypeOrRelation) {
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
				if (isType) {
					const isTemplate = U.Object.isTemplate(object.id);
					const canShowTemplates = !U.Object.getLayoutsWithoutTemplates().includes(object.recommendedLayout) && !isTemplate;

					if (isOwner && total) {
						buttonLayout = (
							<Button
								id="button-layout"
								color="blank"
								className="c28 resetLayout"
								onClick={this.onLayout}
							/>
						);
					};

					if (canShowTemplates) {
						buttonTemplate = (
							<Button 
								id="button-template" 
								text={translate('commonTemplates')} 
								color="blank" 
								className="c28" 
								onClick={this.onTemplates} 
							/>
						);
					};

					if (allowDetails) {
						buttonEdit = (
							<Button 
								id="button-edit" 
								color="blank" 
								className="c28" 
								text={translate('commonEditType')} 
								onClick={() => sidebar.rightPanelToggle(true, true, isPopup, 'type', { rootId })} 
							/>
						);
					};
				};
				
			} else {
				const cn = [ 'c36' ];
				const isInstalled = this.isInstalled();
				const onClick = isInstalled ? null : this.onInstall;
				const color = isInstalled ? 'blank' : 'black';

				if (isInstalled) {
					cn.push('disabled');
				};

				buttonCreate = <Button id="button-install" text={translate('pageHeadSimpleInstall')} color={color} className={cn.join(' ')} onClick={onClick} />;
			};

			if (!canWrite) {
				buttonCreate = null;
				buttonEdit = null;
			};
		};

		if (isDate) {
			buttonCreate = (
				<>
					<Icon className="arrow left withBackground" onClick={() => this.changeDate(-1)} />
					<Icon className="arrow right withBackground" onClick={() => this.changeDate(1)}/>
					<Icon id="calendar-icon" className="calendar withBackground" onClick={this.onCalendar} />
				</>
			);
		};

		if (buttonLayout) {
			buttons.push(() => buttonLayout);
		};
		if (buttonTemplate) {
			buttons.push(() => buttonTemplate);
		};
		if (buttonEdit) {
			buttons.push(() => buttonEdit);
		};
		if (buttonCreate) {
			buttons.push(() => buttonCreate);
		};

		return (
			<div ref={node => this.node = node} className={cn.join(' ')}>
				<div className="sides">
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
							<Editor className="title" id="title" readonly={isType || !allowDetails} />
						</div>
					</div>

					{buttons.length ? (
						<div className="side right">
							{buttons.map((Component, i) => <Component key={i} />)}
						</div>
					) : ''}
				</div>
				{descr}
				{featured}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.init();

		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, [ 'layout' ], true);
		const isType = U.Object.isTypeLayout(object.layout);

		if (isType) {
			U.Data.searchSubscribe({
				subId: SUB_ID_CHECK,
				filters: [
					{ relationKey: 'type', condition: I.FilterCondition.Equal, value: object.id },
				],
				keys: [ 'id' ],
				limit: 1,
			});
		};
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

			if ((item.blockId == J.Constant.blockId.title) && U.Object.isTypeLayout(object.layout)) {
				text = object.pluralName || object.name;
			};

			if ([ translate('defaultNamePage'), Dataview.namePlaceholder(object.layout) ].includes(text)) {
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

	onInstall () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId);

		Action.install(object, false, (message: any) => U.Object.openAuto(message.details));
	};

	onTemplates () {	
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId);

		S.Menu.open('dataviewTemplateList', {
			element: '.headSimple #button-template',
			horizontal: I.MenuDirection.Center,
			subIds: J.Menu.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
			data: {
				withTypeSelect: false,
				typeId: object.id,
				previewSize: I.PreviewSize.Small,
				templateId: object.defaultTemplateId,
				onSetDefault: id => {
					S.Menu.updateData('dataviewTemplateList', { templateId: id });
					U.Object.setDefaultTemplateId(rootId, id);
				},
				onSelect: item => {
					if (item.id == J.Constant.templateId.new) {
						this.onTemplateAdd();
					} else {
						U.Object.openPopup(item);
					};
				},
			}
		});

		analytics.event('ScreenTypeTemplateSelector');
	};

	onTemplateAdd () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId);
		const details: any = {
			targetObjectType: object.id,
			layout: object.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', J.Constant.typeKey.template, S.Common.space, true, (message) => {
			if (message.error.code) {
				return;
			};

			const object = message.details;

			analytics.event('CreateTemplate', { objectType: object.type, route: analytics.route.screenType });
			U.Object.openConfig(object);
		});
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

		S.Menu.open('calendar', {
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

	onLayout = () => {
		const { rootId } = this.props;

		S.Menu.open('select', {
			element: '.headSimple #button-layout',
			horizontal: I.MenuDirection.Center,
			className: 'menuTypeLayout',
			data: {
				sections: [
					{
						name: translate('menuTypeLayoutDescription'),
						children: [ 
							{ isDiv: true },
							{ id: 'reset', icon: 'reset', name: translate('menuTypeLayoutReset') },
						]
					}
				],
				noVirtualisation: true,
				onSelect: () => {
					S.Popup.open('confirm', {
						data: {
							title: translate('popupConfirmTypeLayoutResetTitle'),
							text: translate('popupConfirmTypeLayoutResetText'),
							textConfirm: translate('commonReset'),
							colorConfirm: 'red',
							colorCancel: 'blank',
							onConfirm: () => {
								C.ObjectTypeResolveLayoutConflicts(rootId);
								analytics.event('ResetToTypeDefault', { route: analytics.route.type });
							},
						}
					});
				},
			}
		});
	};

});

export default HeadSimple;