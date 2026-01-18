import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Header, Footer, Loader, ListObject, Deleted, Icon, HeadSimple, IconObject, ObjectName, Tag, Switch } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, sidebar, keyboard, Relation } from 'Lib';
import { observable } from 'mobx';

const PageMainRelation = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const [ isLoading, setIsLoading ] = useState(false);
	const [ isDeleted, setIsDeleted ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const { isPopup } = props;
	const rootId = keyboard.getRootId(isPopup);
	const object = S.Detail.get(rootId, rootId, J.Relation.relation);
	const { isReadonlyRelation, objectTypes } = object;
	const relationFormat = Number(object.relationFormat) || I.RelationType.LongText;
	const canWrite = U.Space.canMyParticipantWrite();
	const subIdObject = S.Record.getSubId(rootId, 'object');
	const totalObject = S.Record.getMeta(subIdObject, '').total;
	const headerRef = useRef(null);
	const headRef = useRef(null);
	const listRef = useRef(null);
	const idRef = useRef('');

	useEffect(() => {
		open();

		return () => {
			close();
		};
	}, []);

	useEffect(() => {
		if (idRef.current != rootId) {
			close();
			open();
		};
	}, [ rootId ]);
	
	const open = () => {
		idRef.current = rootId;
		setIsLoading(true);
		setIsDeleted(false);
		
		C.ObjectOpen(rootId, '', S.Common.space, (message: any) => {
			setIsLoading(false);

			if (!U.Common.checkErrorOnOpen(rootId, message.error.code)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId);
			if (object.isDeleted) {
				setIsDeleted(true);
				return;
			};

			headerRef.current?.forceUpdate();
			headRef.current?.forceUpdate();
			listRef.current?.getData(1);
			S.Common.setRightSidebarState(isPopup, { rootId });
			setDummy(dummy + 1);

			analytics.event('ScreenRelation', { relationKey: object.relationKey });
		});
	};

	const close = () => {
		Action.pageClose(isPopup, idRef.current, true);
		idRef.current = '';
	};

	const getOptionsData = (): { output: any[], more: number, label: string, canAdd: boolean } => {
		let output = [];
		let more = 0;
		let label = '';

		const checkMore = (arr: any[]) => {
			output = arr.slice(0, J.Constant.limit.relation.option);

			if (arr.length > output.length) {
				more = arr.length - output.length;
			};
		};

		switch (relationFormat) {
			case I.RelationType.Object: {
				const types = (object?.objectTypes.map(it => S.Record.getTypeById(it)) || []).filter(it => it);

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

				label = U.Common.plural(relationsOptions.length, translate('pluralOption'));
				checkMore(relationsOptions);
				break;
			};
		};

		return { output, more, label, canAdd: canWrite };
	};

	const onSetAdd = () => {
		C.ObjectCreateSet([ object.id ], { name: `${object.name} set` }, '', S.Common.space, (message: any) => {
			if (!message.error.code) {
				U.Object.openConfig(null, message.details);
			};
		});
	};

	const onMore = () => {
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
							onSetAdd();
							break;
					};
				},
			},
		});
	};

	const onSwitch = (e, key, value) => {
		C.ObjectListSetDetails([ object.id ], [ { key, value: Boolean(value) } ]);
	};

	const onOptionClick = (e, option) => {
		switch (relationFormat) {
			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				onOptionMore();
				break;
			};

			case I.RelationType.Object: {
				U.Object.openAuto(option);
				break;
			};
		};
	};

	const onOptionAdd = () => {
		const param = {
			element: `#page .relationData .options .add`,
			className: 'single',
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
							rootId,
							relation: observable.box(object),
							value: objectTypes,
							addParam: {
								details: U.Object.getNewTypeDetails(),
							},
							filters: [
								{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type },
								{ relationKey: 'recommendedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
							],
							onChange: (value: any) => {
								U.Object.setObjectTypes(object.id, value);
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

	const onOptionRemove = (e, item) => {
		e.preventDefault();
		e.stopPropagation();

		switch (relationFormat) {
			case I.RelationType.Object: {
				U.Object.setObjectTypes(object.id, objectTypes.filter(it => it != item.id));
				break;
			};
		};
	};

	const onOptionMore = () => {
		const { output, canAdd } = getOptionsData();
		const skipIds = output.map(it => it.id);
		const param = {
			element: `#page .relationData .options dd`,
			className: 'single',
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
											U.Object.setObjectTypes(object.id, typeIds.filter(it => it != type.id));
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
								U.Object.setObjectTypes(object.id, [ option.id ].concat(typeIds));
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
						value: [],
						relation: observable.box(object),
					},
				});
				break;
			};
		};
	};

	if (isDeleted) {
		return <Deleted {...props} />;
	} else
	if (isLoading) {
		return <Loader id="loader" fitToContainer={true} isPopup={isPopup} />;
	};

	const columnsObject: any[] = [
		{ relationKey: 'type', name: translate('commonObjectType'), isCell: true },
		{ 
			relationKey: 'createdDate', name: translate('commonCreated'),
			mapper: v => U.Date.dateWithFormat(S.Common.dateFormat, v),
		},
		{ relationKey: object.relationKey, name: translate('commonValue'), isCell: true },
	];

	const data = getOptionsData();
	const { output, more, label } = data;

	let options = null;
	let optionsLabel = label;
	let withMore = false;
	let canAdd = data.canAdd;

	switch (relationFormat) {
		case I.RelationType.Object: {
			options = output.map((type) => (
				<div key={type.id} className="item object" onClick={e => onOptionClick(e, type)}>
					<IconObject object={type} />
					<ObjectName object={type} />

					{!isReadonlyRelation && canWrite ? <Icon onClick={e => onOptionRemove(e, type)} className="remove" /> : ''}
				</div>
			));
			break;
		};

		case I.RelationType.Date: {
			optionsLabel = translate('commonIncludeTime');
			options = [
				(
					<Switch
						value={object.includeTime}
						onChange={(e: any, v: boolean) => onSwitch(e, 'relationFormatIncludeTime', v)}
					/>
				)
			];
			canAdd = false;
			break;
		};

		case I.RelationType.Select:
		case I.RelationType.MultiSelect: {
			options = output.map((option) => (
				<div key={option.id} id={`item-${option.id}`} className="item" onClick={e => onOptionClick(e, option)}>
					<Tag text={option.name} color={option.color} className={Relation.selectClassName(relationFormat)} />
				</div>
			));
			break;
		};
	};

	if (options && (more > 0)) {
		withMore = true;
		options.push(<div key="optionMore" className="more" onClick={onOptionMore}>{more} {translate('commonMore')}...</div>);
	};

	if (options && canAdd && !isReadonlyRelation) {
		const add = <Icon key="optionAdd" className="add" onClick={onOptionAdd} />;
		withMore ? options.unshift(add) : options.push(add);
	};

	if (!output.length && isReadonlyRelation) {
		options = null;
	};

	return (
		<>
			<Header 
				{...props} 
				component="mainObject" 
				ref={headerRef} 
				rootId={rootId} 
			/>

			<div className="blocks wrapper">
				<HeadSimple 
					{...props} 
					ref={headRef} 
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
								onClick={onMore}
							/>
						</div>
					</div>

					<div className="content">
						<ListObject
							ref={listRef}
							{...props}
							sources={[ rootId ]}
							spaceId={object.spaceId}
							subId={subIdObject}
							rootId={rootId}
							columns={columnsObject}
							route={analytics.route.screenRelation}
						/>
					</div>
				</div>
			</div>

			<Footer component="mainObject" {...props} />
		</>
	);

}));

export default PageMainRelation;