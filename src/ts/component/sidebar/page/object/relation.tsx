import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label, Button, Icon } from 'Component';
import { I, S, U, sidebar, translate, keyboard, Relation, C, Preview, analytics } from 'Lib';
import Section from 'Component/sidebar/section';

const SidebarPageObjectRelation = observer(class SidebarPageObjectRelation extends React.Component<I.SidebarPageComponent, {}> {
	
	sectionRefs: Map<string, any> = new Map();

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onSetUp = this.onSetUp.bind(this);
		this.getObject = this.getObject.bind(this);
		this.onLocal = this.onLocal.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};

    render () {
		const { rootId, readonly } = this.props;
		const object = this.getObject();
		const sections = this.getSections();
		const isReadonly = readonly || !S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
		const type = S.Record.getTypeById(object.type);
		const allowObjectDetails = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);
		const allowTypeDetails = S.Block.isAllowed(type?.restrictions, [ I.RestrictionObject.Details ]);

        return (
			<>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarTypeRelation')} />
					</div>

					{allowTypeDetails ? (
						<div className="side right">
							<Button color="blank" text={translate('sidebarObjectRelationSetUp')} className="simple" onClick={this.onSetUp} />
						</div>
					) : ''}
				</div>

				<div className="body customScrollbar">
					{!type ? (
						<div className="section">
							<div className="item empty">
								{translate('sidebarObjectRelationTypeDeleted')}
							</div>
						</div>
					) : ''}

					{sections.map((section, i) => {
						const { id, name, description, withToggle } = section;
						const lcn = [];
						const onToggle = withToggle ? () => this.onToggle(id) : null;

						if (withToggle) {
							lcn.push('sectionToggle');
						};

						let button = null;
						if ((id == 'local') && allowObjectDetails && !readonly) {
							button = (
								<Icon 
									className="plus withBackground" 
									tooltip={translate('commonAddRelation')}
									onClick={this.onAdd}
								/>
							);
						};

						return (
							<div id={`relationGroup-${id}`} className="group" key={id}>
								{name ? (
									<div className="titleWrap">
										<div className="side left">
											<Label text={name} onClick={onToggle} className={lcn.join(' ')} />
											{description ? (
												<Icon
													className="question withBackground"
													tooltipClassName="relationGroupDescription"
													tooltip={description}
													tooltipX={I.MenuDirection.Right}
													tooltipY={I.MenuDirection.Center}
													tooltipOffsetX={-8}
													tooltipDelay={0}
												/>
											) : ''}
										</div>

										<div className="side right">
											{button}
										</div>
									</div>
								) : ''}

								<div className={[ 'list', (withToggle ? 'withToggle' : '') ].join(' ')}>
									{!section.children.length ? (
										<div className="item empty">
											{translate('sidebarObjectRelationEmpty')}
										</div>
									) : ''}

									{section.children.map((item, i) => (
										<Section
											{...this.props}
											ref={ref => this.sectionRefs.set(item.id, ref)}
											key={item.id}
											id={item.id}
											component="object/relation"
											rootId={rootId}
											object={object}
											item={item}
											readonly={isReadonly}
											onDragStart={e => this.onDragStart(e, item)}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</>
		);
	};

	componentDidMount () {
		analytics.event('ScreenObjectRelation');
	};

	getObject () {
		const { rootId } = this.props;
		return S.Detail.get(rootId, rootId);
	};

	getSections () {
		const { rootId } = this.props;
		const object = this.getObject();
		const isTemplate = U.Object.isTemplate(object.type);
		const type = S.Record.getTypeById(isTemplate ? object.targetObjectType : object.type) || {};
		const local = S.Record
			.getConflictRelations(rootId, rootId, type.id)
			.sort(U.Data.sortByName)
			.map((it) => ({ ...it, onMore: this.onLocal }));
		const localKeys = local.map(it => it.relationKey);
		const recommendedIds = Relation.getArrayValue(type.recommendedRelations);
		const hiddenIds = Relation.getArrayValue(type.recommendedHiddenRelations);

		let items = recommendedIds.map(it => S.Record.getRelationById(it));
		items = items.filter(it => it && it.relationKey && !it.isArchived);
		items = S.Record.checkHiddenObjects(items);
		items = items.filter(it => !localKeys.includes(it.relationKey));

		let hidden = hiddenIds.map(it => S.Record.getRelationById(it));
		hidden = S.Record.checkHiddenObjects(hidden);
		hidden = hidden.filter(it => it && !(it.isReadonlyValue && Relation.isEmpty(object[it.relationKey])));

		const sections = [
			{ id: 'object', children: items },
			{ id: 'hidden', name: translate('sidebarTypeRelationHidden'), children: hidden, withToggle: true },
			{ id: 'local', name: translate('sidebarRelationLocal'), children: local, description: translate('sidebarObjectRelationLocalDescription') }
		];

		return sections;
	};

	getRelations () {
		const { rootId } = this.props;
		const object = this.getObject();

		return S.Record.getObjectRelations(rootId, object.type);
	};

	onSetUp () {
		const { isPopup } = this.props;
		const object = this.getObject();
		const rootId = object.targetObjectType || object.type;

		sidebar.rightPanelSetState(isPopup, { page: 'type', rootId, noPreview: true, back: 'object/relation' });
	};

	onDragStart (e: any, item: any) {
		e.stopPropagation();

		const dragProvider = S.Common.getRef('dragProvider');
		const selection = S.Common.getRef('selectionProvider');

		keyboard.disableSelection(true);
		selection?.clear();
		dragProvider?.onDragStart(e, I.DropType.Relation, [ item.id ], this);
	};

	onLocal (e: React.MouseEvent, item: any) {
		const { x, y } = keyboard.mouse.page;
		const object = this.getObject();
		const isTemplate = U.Object.isTemplate(object.type);
		const type = S.Record.getTypeById(isTemplate ? object.targetObjectType : object.type);

		S.Menu.open('select', {
			rect: { width: 0, height: 0, x: x + 4, y },
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				options: [
					{ id: 'addToType', name: translate('sidebarRelationLocalAddToCurrentType'), icon: '' },
					{ id: 'remove', name: translate('sidebarRelationLocalRemoveFromObject'), color: 'red' },
				],
				onSelect: (e, option) => {
					switch (option.id) {
						case 'addToType': {
							if (!type) {
								break;
							};

							C.ObjectListSetDetails([ type.id ], [ { key: 'recommendedRelations', value: type.recommendedRelations.concat([ item.id ]) || [] } ]);
							break;
						};

						case 'remove': {
							C.ObjectRelationDelete(object.id, [ item.relationKey ]);
							break;
						};
					};
				},
			},
		});
	};

	onAdd (e: any) {
		const object = this.getObject();
		const sections = this.getSections();
		const keys = sections.reduce((acc, it) => {
			const keys = it.children.map((it) => it.relationKey);
			return acc.concat(keys);
		}, []);

		S.Menu.open('relationSuggest', { 
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Center,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				filter: '',
				rootId: object.id,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: keys,
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					console.log('addCommand', rootId, blockId, relation);
					C.ObjectRelationAdd(rootId, [ relation.relationKey ], onChange);
				},
			}
		});
	};

	onToggle (id: string) {
		const obj = $(`#sidebarRight #relationGroup-${id}`);
		const toggle = obj.find('.sectionToggle');
		const list = obj.find('> .list');
		const isOpen = list.hasClass('isOpen');

		U.Common.toggle(list, 200);
		toggle.toggleClass('isOpen', !isOpen);

		analytics.event('ScreenObjectRelationToggle', { type: isOpen ? 'Collapse' : 'Extend' });
	};

});

export default SidebarPageObjectRelation;
