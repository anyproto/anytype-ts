import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Cell, Error, Icon, EmptySearch } from 'Component';
import { I, M, C, S, U, J, Relation, translate, Dataview, analytics } from 'Lib';

const Diff = require('diff');

const ID_PREFIX = 'popupRelation';
const SUB_ID_OBJECT = `${ID_PREFIX}-objects`;
const SUB_ID_DEPS = `${ID_PREFIX}-deps`;

interface State {
	error: string;
};

const PopupRelation = observer(class PopupRelation extends React.Component<I.Popup, State> {

	refCheckbox = null;
	cellRefs: Map<string, any> = new Map();
	initial: any = {};
	details: any = {};
	addRelationKeys = [];
	state = {
		error: '',
	};

	constructor (props: I.Popup) {
		super(props);

		this.save = this.save.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { readonly, view } = data;
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
								getView={view ? (() => view): null}
								pageContainer={U.Common.getCellContainer('popupRelation')}
							/>
						</div>
					</div>
				</div>
			);
		};

		return (
			<div>
				<Label text={U.Common.sprintf(translate(`popupRelationTitle`), length, U.Common.plural(length, translate('pluralLCObject')))} />

				{!relations.length ? <EmptySearch text={translate('popupRelationEmpty')} /> : (
					<div className="blocks">
						{relations.map(item => <Item key={item.relationKey} {...item} />)}
					</div>
				)}

				<div className="line" />

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

	componentDidUpdate (): void {
		const id = S.Common.cellId;		
		if (id) {
			S.Common.cellId = '';
			
			const ref = this.cellRefs.get(id);
			if (ref) {
				ref.onClick($.Event('click'));
			};
		};
	};

	componentWillUnmount(): void {
		S.Menu.closeAll(J.Menu.cell);
		C.ObjectSearchUnsubscribe([ SUB_ID_OBJECT, SUB_ID_DEPS ]);
	};

	loadObjects (callBack?: () => void) {
		const { param } = this.props;
		const { data } = param;
		const { relationKeys } = data;
		const objectIds = this.getObjectIds();
		const keys = this.getRelationKeys();

		U.Data.searchSubscribe({
			subId: SUB_ID_OBJECT,
			filters: [
				{ relationKey: 'id', condition: I.FilterCondition.In, value: objectIds },
			],
			keys: J.Relation.default.concat(keys),
			noDeps: true,
		}, () => {
			if (!relationKeys) {
				const objects = this.getObjects();

				let keys = [];

				objects.forEach(it => {
					const type = S.Record.getTypeById(it.type);
					if (!type) {
						return;
					};

					const recommended = (type.recommendedRelations || []).map(it => {
						const relation = S.Record.getRelationById(it);
						return relation ? relation.relationKey : '';
					}).filter(it => it);

					if (recommended.length) {
						keys = keys.concat(recommended);
					};
				});

				if (keys.length) {
					this.props.param.data.relationKeys = U.Common.arrayUnique(keys);
				};
			};

			if (callBack) {
				callBack();
			};
		});
	};

	loadDeps (callBack?: () => void) {
		const cb = callBack || (() => {});

		let depIds = [];

		for (const k in this.details) {
			const relation = S.Record.getRelationByKey(k);

			if (relation && Relation.isArrayType(relation.format)) {
				depIds = depIds.concat(Relation.getArrayValue(this.details[k]));
			};
		};

		if (!depIds.length) {
			cb();
			return;
		};

		U.Data.searchSubscribe({
			subId: SUB_ID_DEPS,
			filters: [
				{ relationKey: 'id', condition: I.FilterCondition.In, value: depIds },
			],
			noDeps: true,
		}, cb);
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

				if (Relation.isArrayType(relation.format)) {
					const tmp = [];

					value.forEach(id => {
						cnt[relationKey] = cnt[relationKey] || {};
						cnt[relationKey][id] = cnt[relationKey][id] || 0;
						cnt[relationKey][id]++;

						if (cnt[relationKey][id] == objects.length) {
							tmp.push(id);
						};
					});

					if (tmp.length) {
						this.details[relationKey] = tmp;
					};
				} else {
					cnt[relationKey] = cnt[relationKey] || 1;
					if (reference && U.Common.compareJSON(value, reference[relationKey])) {
						cnt[relationKey]++;
					};
					if ((cnt[relationKey] == objects.length) && value) {
						this.details[relationKey] = value;
					};
				};

				object[relationKey] = value;
			});

			reference = object;
		});

		this.initial = U.Common.objectCopy(this.details);
		this.forceUpdate();
	};

	getRelationKeys (): string[] {
		return U.Common.arrayUnique(this.props.param.data.relationKeys || J.Relation.default);
	};

	getRelations (): any[] {
		const { config } = S.Common;

		let ret = this.getRelationKeys().map(relationKey => S.Record.getRelationByKey(relationKey));
		ret = S.Record.checkHiddenObjects(ret);
		ret = ret.filter(it => it && !it.isReadonlyValue);
		ret = ret.sort(U.Data.sortByName);
		return ret;
	};

	getObjectIds () {
		return this.props.param.data.objectIds || [];
	};

	getObjects () {
		return S.Record.getRecords(SUB_ID_OBJECT, this.getRelationKeys());
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const relation = S.Record.getRelationByKey(relationKey);
		if (!relation) {
			return;
		};

		this.details[relationKey] = Relation.formatValue(relation, value, true);
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

		S.Menu.open('relationSuggest', { 
			element,
			offsetX: J.Size.blockMenu,
			horizontal: I.MenuDirection.Right,
			vertical: I.MenuDirection.Center,
			onOpen: () => $(element).addClass('active'),
			onClose: () => $(element).removeClass('active'),
			data: {
				menuIdEdit: 'blockRelationEdit',
				skipKeys: this.getRelationKeys(),
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					this.details[relation.relationKey] = Relation.formatValue(relation, null, true);
					this.props.param.data.relationKeys = this.getRelationKeys().concat([ relation.relationKey ]);

					this.addRelationKeys.push(relation.relationKey);
					this.loadObjects();

					S.Menu.close('relationSuggest');
				},
			}
		});
	};

	onCheckbox () {
		this.refCheckbox.toggle();
	};

	save () {
		const { param, close } = this.props;
		const { data } = param;
		const { view } = data;
		const objectIds = this.getObjectIds();
		const operations: any[] = []; 

		for (const k in this.details) {
			const relation = S.Record.getRelationByKey(k);

			if (!relation) {
				continue;
			};

			if (Relation.isArrayType(relation.format) && (relation.format != I.RelationType.Select)) {
				const diff = Diff.diffArrays(this.initial[k] || [], this.details[k] || []);

				diff.forEach(it => {
					let opKey = '';
					if (it.added) {
						opKey = 'add';
					} else
					if (it.removed) {
						opKey = 'remove';
					};

					if (opKey) {
						const operation = { relationKey: k };

						operation[opKey] = Relation.formatValue(relation, it.value, true);
						operations.push(operation);
					};
				});
			} else {
				operations.push({ relationKey: k, set: Relation.formatValue(relation, this.details[k], true) });
			};
		};

		C.ObjectListModifyDetailValues(objectIds, operations, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			} else {
				close();
			};
		});

		analytics.event('ChangeRelationValue', { id: 'Batch', count: objectIds.length });

		if (this.addRelationKeys.length && view) {
			const cb = () => {
				this.addRelationKeys.shift();
				if (!this.addRelationKeys.length) {
					return;
				};

				this.addRelation(this.addRelationKeys[0], cb);
			};

			this.addRelation(this.addRelationKeys[0], cb);
		};
	};

	addRelation (relationKey: string, callBack?: (message: any) => void){
		const { param } = this.props;
		const { data } = param;
		const { targetId, blockId, view } = data;

		if (!view) {
			return;
		};

		Dataview.relationAdd(targetId, blockId, relationKey, view.relations.length, view, callBack);
	};

});

export default PopupRelation;
