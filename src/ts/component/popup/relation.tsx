import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Cell, Error, Icon, EmptySearch } from 'Component';
import { I, M, C, UtilCommon, Relation, UtilData, translate } from 'Lib';
import { dbStore, commonStore, popupStore, menuStore } from 'Store';
const Constant = require('json/constant.json');

const ID_PREFIX = 'popupRelation';
const SUB_ID_OBJECT = `${ID_PREFIX}-objects`;
const SUB_ID_DEPS = `${ID_PREFIX}-deps`;

interface State {
	error: string;
};

const PopupRelation = observer(class PopupRelation extends React.Component<I.Popup, State> {

	cellRefs: Map<string, any> = new Map();
	details: any = {};
	state = {
		error: '',
	};

	constructor (props: I.Popup) {
		super(props);

		this.save = this.save.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { readonly } = data;
		const { error } = this.state;
		const objects = this.getObjects();
		const relations = this.getRelations();
		const length = objects.length;

		const Item = (item: any) => {
			const id = Relation.cellId(ID_PREFIX, item.relationKey, '');
			const cn = [ 'block', 'blockRelation' ];

			if (item.isHidden) {
				cn.push('isHidden');
			};

			return (
				<div className={cn.join(' ')}>
					<div className="sides">
						<div className="info">
							<div className="name">{item.name}</div>
						</div>
						<div 
							id={id} 
							className={[ 'cell', Relation.className(item.format), (!readonly ? 'canEdit' : '') ].join(' ')} 
							onClick={e => this.onCellClick(e, id)}
						>
							<Cell 
								ref={ref => this.cellRefs.set(id, ref)}
								rootId={SUB_ID_DEPS}
								subId={SUB_ID_DEPS}
								block={new M.Block({ id: '', type: I.BlockType.Relation, content: {} })}
								relationKey={item.relationKey}
								getRecord={() => this.details}
								viewType={I.ViewType.Grid}
								readonly={readonly}
								idPrefix={ID_PREFIX}
								menuClassName="fromBlock"
								onCellChange={this.onCellChange}
								pageContainer={UtilCommon.getCellContainer('popupRelation')}
							/>
						</div>
					</div>
				</div>
			);
		};

		return (
			<div>
				<Label text={UtilCommon.sprintf(translate(`popupRelationTitle`), length, UtilCommon.plural(length, translate('pluralLCObject')))} />

				{!relations.length ? <EmptySearch text={translate('popupRelationEmpty')} /> : (
					<div className="blocks">
						{relations.map(item => <Item key={item.relationKey} {...item} />)}
					</div>
				)}

				<div className="line" />

				<div id="item-add" className="item add" onClick={this.onAdd}>
					<Icon className="plus" />
					{translate('commonAddRelation')}
				</div>

				<div className="buttons">
					<Button text="Save" className="c28" onClick={this.save} />
					<Button text="Cancel" className="c28" color="blank" onClick={() => close()} />
				</div>

				<Error text={error} />
			</div>
		);
	};

	componentDidMount(): void {
		this.loadObjects(() => this.initValues());
	};

	componentWillUnmount(): void {
		menuStore.closeAll(Constant.menuIds.cell);
		C.ObjectSearchUnsubscribe([ SUB_ID_OBJECT, SUB_ID_DEPS ]);
	};

	loadObjects (callBack?: () => void) {
		const objectIds = this.getObjectIds();
		const relationKeys = this.getRelationKeys();

		UtilData.searchSubscribe({
			subId: SUB_ID_OBJECT,
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: objectIds },
			],
			keys: Constant.defaultRelationKeys.concat(relationKeys),
			noDeps: true,
		}, callBack);
	};

	loadDeps (callBack?: () => void) {
		let depIds = [];

		for (const k in this.details) {
			const relation = dbStore.getRelationByKey(k);

			if (relation && [ I.RelationType.File, I.RelationType.Object ].includes(relation.format)) {
				depIds = depIds.concat(Relation.getArrayValue(this.details[k]));
			};
		};

		if (depIds.length) {
			UtilData.searchSubscribe({
				subId: SUB_ID_DEPS,
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: depIds },
				],
				noDeps: true,
			}, callBack);
		};
	};

	initValues () {
		const relations = this.getRelations();
		const objects = this.getObjects();
		const cnt = {};

		let reference = null;

		objects.forEach(object => {
			relations.forEach(relation => {
				const { relationKey } = relation;
				const value = Relation.formatValue(relation, object[relationKey], false);

				cnt[relationKey] = cnt[relationKey] || 1;

				if (reference && (JSON.stringify(value) == JSON.stringify(reference[relationKey]))) {
					cnt[relationKey]++;
				};

				if (cnt[relationKey] == objects.length) {
					this.details[relationKey] = value;
				};

				object[relationKey] = value;
			});

			reference = object;
		});

		this.forceUpdate();
	};

	getRelationKeys (): string[] {
		return this.props.param.data.relationKeys || Constant.defaultRelationKeys;
	};

	getRelations (): any[] {
		const { config } = commonStore;

		let ret = this.getRelationKeys().map(relationKey => dbStore.getRelationByKey(relationKey));

		ret = ret.filter(it => {
			return (config.debug.hiddenObject ? true : !it.isHidden) && !it.isReadonlyValue;
		});
		ret = ret.sort(UtilData.sortByName);
		return ret;
	};

	getObjectIds () {
		return this.props.param.data.objectIds || [];
	};

	getObjects () {
		return dbStore.getRecords(SUB_ID_OBJECT, this.getRelationKeys());
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		this.details[relationKey] = value;
		this.loadDeps(() => this.forceUpdate());

		if (callBack) {
			callBack({ error: { code: 0 } });
		};
	};

	onCellClick (e: any, id: string) {
		this.cellRefs.get(id).onClick(e);
	};

	onAdd () {
		const { getId } = this.props;
		const element = `#${getId()} #item-add`;

		menuStore.open('relationSuggest', { 
			element,
			offsetX: Constant.size.blockMenu,
			horizontal: I.MenuDirection.Right,
			vertical: I.MenuDirection.Center,
			onOpen: () => $(element).addClass('active'),
			onClose: () => $(element).removeClass('active'),
			data: {
				skipKeys: this.getRelationKeys(),
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					this.details[relation.relationKey] = Relation.formatValue(relation, null, true);
					this.props.param.data.relationKeys = this.getRelationKeys().concat([ relation.relationKey ]);
					this.loadObjects();
				},
			}
		});
	};

	save () {
		const { close } = this.props;
		const objectIds = this.getObjectIds();
		const details: any[] = []; 

		for (const k in this.details) {
			const relation = dbStore.getRelationByKey(k);
			if (relation) {
				details.push({ key: k, value: Relation.formatValue(relation, this.details[k], true) });
			};
		};

		popupStore.open('confirm', {
			data: {
				title: 'Are you sure?',
				text: UtilCommon.sprintf('This will update relation values of %d objects', objectIds.length),
				onConfirm: () => {
					C.ObjectListSetDetails(objectIds, details, (message: any) => {
						if (message.error.code) {
							this.setState({ error: message.error.description });
						} else {
							close();
						};
					});
				},
			},
		});

	};

});

export default PopupRelation;
