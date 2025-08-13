import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, ListObject, Deleted, Icon, HeadSimple, IconObject, ObjectName, Tag, Switch } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, sidebar, keyboard, Relation } from 'Lib';
import { observable } from 'mobx';

interface State {
	isDeleted: boolean;
	isLoading: boolean;
};

const PageMainRelation = observer(class PageMainRelation extends React.Component<I.PageComponent, State> {

	id = '';
	refHeader: any = null;
	refHead: any = null;
	refListObject: any = null;

	state = {
		isDeleted: false,
		isLoading: false
	};

	constructor (props: I.PageComponent) {
		super(props);

		this.onMore = this.onMore.bind(this);
		this.onOptionClick = this.onOptionClick.bind(this);
		this.onOptionAdd = this.onOptionAdd.bind(this);
		this.onOptionRemove = this.onOptionRemove.bind(this);
		this.onOptionMore = this.onOptionMore.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;
		const { isPopup } = this.props;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		} else
		if (isLoading) {
			return <Loader id="loader" fitToContainer={true} isPopup={isPopup} />;
		};

		const rootId = this.getRootId();
		const object = this.getObject();
		const { relationFormat, isReadonlyRelation } = object;
		const canWrite = U.Space.canMyParticipantWrite();
		const subIdObject = S.Record.getSubId(rootId, 'object');
		const totalObject = S.Record.getMeta(subIdObject, '').total;
		const { output, more, label, canAdd } = this.getOptionsData();

		const columnsObject: any[] = [
			{ relationKey: 'type', name: translate('commonObjectType'), isCell: true },
			{ 
				relationKey: 'createdDate', name: translate('commonCreated'),
				mapper: v => U.Date.dateWithFormat(S.Common.dateFormat, v),
			},
			{ relationKey: object.relationKey, name: translate('commonValue'), isCell: true },
		];

		let options = null;
		let optionsLabel = label;
		let withMore = false;

		switch (relationFormat) {
			case I.RelationType.Object: {
				options = output.map((type) => (
					<div key={type.id} className="item object" onClick={e => this.onOptionClick(e, type)}>
						<IconObject object={type} />
						<ObjectName object={type} />

						{!isReadonlyRelation && canWrite ? <Icon onClick={e => this.onOptionRemove(e, type)} className="remove" /> : ''}
					</div>
				));
				break;
			};

			case I.RelationType.Date: {
				optionsLabel = translate('commonIncludeTime');
				options = (
					<Switch
						value={object.includeTime}
						onChange={(e: any, v: boolean) => this.onSwitch(e, 'relationFormatIncludeTime', v)}
					/>
				);
				break;
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				options = output.map((option) => (
					<div key={option.id} id={`item-${option.id}`} className="item" onClick={e => this.onOptionClick(e, option)}>
						<Tag text={option.name} color={option.color} className={Relation.selectClassName(relationFormat)} />
					</div>
				));
				break;
			};
		};

		if (options && more > 0) {
			withMore = true;
			options.push(<div key="optionMore" className="more" onClick={this.onOptionMore}>{more} {translate('commonMore')}...</div>);
		};

		if (options && canAdd && !isReadonlyRelation) {
			const add = <Icon key="optionAdd" className="add" onClick={this.onOptionAdd} />;

			if (withMore) {
				options.unshift(add);
			} else {
				options.push(add);
			};
		};

		if (!output.length && (!canAdd || isReadonlyRelation)) {
			options = null;
		};

		return (
			<>
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

				<div className="blocks wrapper">
					<HeadSimple 
						{...this.props} 
						ref={ref => this.refHead = ref} 
						placeholder={translate('defaultNameRelation')} 
						rootId={rootId}
					/>

					<div className="relationData">
						<dl>
							<dt>{translate('pageMainRelationPropertyType')}</dt>
							<dd>{translate(`relationName${relationFormat}`)}</dd>
						</dl>

						{options ? (
							<dl className={[ 'options', Relation.selectClassName(relationFormat) ].join(' ')}>
								<dt>{optionsLabel}</dt>
								<dd>{options}</dd>
							</dl>
						) : ''}
					</div>

					{!object._empty_ ? (
						<div className="section set">
							<div className="title">
								<div className="side left">
									{U.Common.plural(totalObject, translate('pluralObject'))}
									<span className="cnt">{totalObject}</span>
								</div>

								<div className="side right">
									<Icon
										id="button-create"
										className="more withBackground"
										onClick={this.onMore}
									/>
								</div>
							</div>

							<div className="content">
								<ListObject
									ref={ref => this.refListObject = ref}
									{...this.props}
									sources={[ rootId ]}
									spaceId={object.spaceId}
									subId={subIdObject}
									rootId={rootId}
									columns={columnsObject}
									route={analytics.route.screenRelation}
								/>
							</div>
						</div>
					) : ''}
				</div>

				<Footer component="mainObject" {...this.props} />
			</>
		);
	};

	componentDidMount () {
		this.open();
	};

	componentDidUpdate () {
		this.open();
	};

	componentWillUnmount () {
		this.close();
	};

	open () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.close();
		this.id = rootId;
		this.setState({ isLoading: true });
		
		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			sidebar.rightPanelSetState(isPopup, { rootId });
			this.setState({ isLoading: false });

			analytics.event('ScreenRelation', { relationKey: object.relationKey });
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup } = this.props;
		const close = !isPopup || (this.getRootId() == this.id);

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	getRootId () {
		return keyboard.getRootId(this.props.isPopup);
	};

	getObject () {
		const rootId = this.getRootId();
		return S.Detail.get(rootId, rootId, J.Relation.relation);
	};

	getOptionsData (): { output: any[], more: number, label: string, canAdd: boolean } {
		const object = this.getObject();
		const { relationFormat } = object;
		const canWrite = U.Space.canMyParticipantWrite();

		let output = [];
		let more = 0;
		let label = '';
		let canAdd = false;

		const checkMore = (arr: any[]) => {
			output = arr.slice(0, J.Constant.limit.relation.option);

			if (arr.length > output.length) {
				more = arr.length - output.length;
			};
		};

		switch (relationFormat) {
			case I.RelationType.Object: {
				const types = (object?.objectTypes.map(it => S.Record.getTypeById(it)) || []).filter(it => it);

				canAdd = canWrite;
				label = U.Common.plural(types.length, translate('pluralObjectType'));

				checkMore(types);
				break;
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				const relationsOptions = Relation.getOptions(S.Record.getRecordIds(J.Constant.subId.option, ''))
					.filter(it => (it.relationKey == object.relationKey) && !it.isArchived && !it.isDeleted)
					.sort((c1, c2) => {
						if (c1.createdDate > c2.createdDate) return -1;
						if (c1.createdDate < c2.createdDate) return 1;
						return 0;
					});

				canAdd = canWrite;
				label = U.Common.plural(relationsOptions.length, translate('pluralOption'));

				checkMore(relationsOptions);
				break;
			};
		};

		return { output, more, label, canAdd };
	};

	onSetAdd () {
		const object = this.getObject();

		C.ObjectCreateSet([ object.id ], { name: object.name + ' set' }, '', S.Common.space, (message: any) => {
			if (!message.error.code) {
				U.Object.openConfig(message.details);
			};
		});
	};

	onMore () {
		const options = [
			{ id: 'set', name: translate('pageMainTypeNewSetOfObjects') }
		];

		S.Menu.open('select', { 
			element: `#button-create`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'set':
							this.onSetAdd();
							break;
					};
				},
			},
		});
	};

	onSwitch (e, key, value) {
		if (!U.Space.canMyParticipantWrite()) {
			return;
		};

		const object = this.getObject();

		C.ObjectListSetDetails([ object.id ], [ { key, value: Boolean(value) } ]);
	};

	onOptionClick (e, option) {
		const object = this.getObject();
		const { relationFormat } = object;

		switch (relationFormat) {
			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				if (!U.Space.canMyParticipantWrite()) {
					break;
				};
				S.Menu.open('dataviewOptionEdit', {
					element: `#page #item-${option.id}`,
					offsetY: 4,
					data: {
						option: option,
					}
				});
				break;
			};

			case I.RelationType.Object: {
				U.Object.openAuto(option);
				break;
			};
		};
	};

	onOptionAdd () {
		const object = this.getObject();
		const { relationFormat, objectTypes } = object;
		const param = {
			element: `#page .relationData .options .add`,
			className: 'single',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			offsetY: 8,
		};

		switch (relationFormat) {
			case I.RelationType.Object: {
				S.Menu.closeAll([], () => {
					S.Menu.open('dataviewObjectList', {
						...param,
						data: {
							canAdd: true,
							canEdit: true,
							rootId: this.getRootId(),
							relation: observable.box(object),
							value: objectTypes,
							addParam: {
								details: U.Object.getNewTypeDetails(),
							},
							filters: [
								{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
								{ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
							],
							onChange: (value: any, callBack?: () => void) => {
								const details = [ { key: 'relationFormatObjectTypes', value: value } ];

								C.ObjectListSetDetails([ object.id ], details);
								S.Menu.closeAll();
							},
						}
					});
				});

				break;
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				const colors = U.Menu.getBgColors();

				S.Menu.open('dataviewOptionEdit', {
					...param,
					data: {
						option: { name: '', color: colors[U.Common.rand(1, colors.length - 1)].value },
						isNew: true,
						relationKey: object.relationKey,
					},
				});
				break;
			};
		};
	};

	onOptionRemove (e, item) {
		const object = this.getObject();
		const { relationFormat, objectTypes } = object;

		e.preventDefault();
		e.stopPropagation();

		switch (relationFormat) {
			case I.RelationType.Object: {
				const details = [ { key: 'relationFormatObjectTypes', value: Relation.getArrayValue(objectTypes.filter(it => it != item.id)) } ];

				C.ObjectListSetDetails([ object.id ], details);
				break;
			};
		};
	};

	onOptionMore () {
		const object = this.getObject();
		const { output, canAdd } = this.getOptionsData();
		const skipIds = output.map(it => it.id);
		const { relationFormat, isReadonlyRelation } = object;
		const param = {
			element: `#page .relationData .options .more`,
			className: 'single',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			offsetY: 8,
		};

		switch (relationFormat) {
			case I.RelationType.Object: {
				const types = (object?.objectTypes.map(it => S.Record.getTypeById(it)) || []).filter(it => it);
				const typeIds = types.map(it => it.id);

				let onMore = null;
				
				if (canAdd && !isReadonlyRelation) {
					onMore = (e: MouseEvent, context: any, item: any) => {
						const { props } = context;
						const { className, classNameWrap } = props.param;
						const type = S.Record.getTypeById(item.id);

						S.Menu.open('select', {
							element: `#${props.getId()} #item-${item.id} .icon.more`,
							horizontal: I.MenuDirection.Center,
							offsetY: 4,
							className,
							classNameWrap,
							data: {
								options: [
									{ id: 'unlink', name: translate('commonUnlink') }
								],
								onSelect: (event: any, element: any) => {
									switch (element.id) {
										case 'unlink': {
											const details = [ { key: 'relationFormatObjectTypes', value: typeIds.filter(it => it != type.id) } ];

											C.ObjectListSetDetails([ object.id ], details);
											S.Menu.close('typeSuggest');
											break;
										};
									};
								}
							}
						});
					};
				};

				S.Menu.open('typeSuggest', {
					...param,
					data: {
						canAdd: canAdd && !isReadonlyRelation,
						onMore,
						filters: [
							{ relationKey: 'id', condition: I.FilterCondition.In, value: typeIds },
							{ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds },
						],
						onClick: (option: any) => {
							if (!typeIds.includes(option.id)) {
								const details = [ { key: 'relationFormatObjectTypes', value: [ option.id ].concat(typeIds) } ];

								C.ObjectListSetDetails([ object.id ], details);
							} else {
								U.Object.openAuto(option);
							};
						},
					}
				});
				break;
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				S.Menu.open('dataviewOptionList', {
					...param,
					onClose: () => S.Menu.closeAll([ 'dataviewOptionList', 'dataviewOptionEdit', 'select' ]),
					data: {
						canAdd: canAdd && !isReadonlyRelation,
						canEdit: canAdd && !isReadonlyRelation,
						noSelect: true,
						skipIds,
						value: [],
						relation: observable.box(object),
					},
				});
				break;
			};
		};
	};

});

export default PageMainRelation;
