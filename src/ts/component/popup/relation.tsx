import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Label, Button, Cell, Error, EmptySearch } from 'Component';
import { I, M, C, S, U, J, Relation, translate, Dataview, analytics } from 'Lib';

const Diff = require('diff');

const ID_PREFIX = 'popupRelation';
const SUB_ID_OBJECT = `${ID_PREFIX}-objects`;
const SUB_ID_DEPS = `${ID_PREFIX}-deps`;

const PopupRelation = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close, getId } = props;
	const { data } = param;
	const { readonly, view } = data;

	const [ error, setError ] = useState('');

	const checkboxRef = useRef(null);
	const cellRefs = useRef(new Map());
	const initialRef = useRef({});
	const detailsRef = useRef({});
	const addRelationKeysRef = useRef([]);

	const getRelationKeys = (): string[] => {
		return U.Common.arrayUnique(param.data.relationKeys || J.Relation.default);
	};

	const getRelations = (): any[] => {
		let ret = getRelationKeys().map(relationKey => S.Record.getRelationByKey(relationKey));
		ret = S.Record.checkHiddenObjects(ret);
		ret = ret.filter(it => it && !it.isReadonlyValue);
		ret = ret.sort(U.Data.sortByName);
		return ret;
	};

	const getObjectIds = () => {
		return param.data.objectIds || [];
	};

	const getObjects = () => {
		return S.Record.getRecords(SUB_ID_OBJECT, getRelationKeys());
	};

	const loadDeps = (callBack?: () => void) => {
		const cb = callBack || (() => {});

		let depIds = [];

		for (const k in detailsRef.current) {
			const relation = S.Record.getRelationByKey(k);

			if (relation && Relation.isArrayType(relation.format)) {
				depIds = depIds.concat(Relation.getArrayValue(detailsRef.current[k]));
			};
		};

		if (!depIds.length) {
			cb();
			return;
		};

		U.Subscription.subscribe({
			subId: SUB_ID_DEPS,
			filters: [
				{ relationKey: 'id', condition: I.FilterCondition.In, value: depIds },
			],
			noDeps: true,
		}, cb);
	};

	const initValues = () => {
		const relations = getRelations();
		const objects = getObjects();
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
						detailsRef.current[relationKey] = tmp;
					};
				} else {
					cnt[relationKey] = cnt[relationKey] || 1;
					if (reference && U.Common.compareJSON(value, reference[relationKey])) {
						cnt[relationKey]++;
					};
					if ((cnt[relationKey] == objects.length) && value) {
						detailsRef.current[relationKey] = value;
					};
				};

				object[relationKey] = value;
			});

			reference = object;
		});

		initialRef.current = U.Common.objectCopy(detailsRef.current);
	};

	const loadObjects = (callBack?: () => void) => {
		const { relationKeys } = data;
		const objectIds = getObjectIds();
		const keys = getRelationKeys();

		U.Subscription.subscribe({
			subId: SUB_ID_OBJECT,
			filters: [
				{ relationKey: 'id', condition: I.FilterCondition.In, value: objectIds },
			],
			keys: J.Relation.default.concat(keys),
			noDeps: true,
		}, () => {
			if (!relationKeys) {
				const objects = getObjects();

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
					param.data.relationKeys = U.Common.arrayUnique(keys);
				};
			};

			if (callBack) {
				callBack();
			};
		});
	};

	const onCellChange = (id: string, relationKey: string, value: any, callBack?: (message: any) => void) => {
		const relation = S.Record.getRelationByKey(relationKey);
		if (!relation) {
			return;
		};

		detailsRef.current[relationKey] = Relation.formatValue(relation, value, true);
		loadDeps();

		if (callBack) {
			callBack({ error: { code: 0 } });
		};
	};

	const onCellClick = (e: any, id: string) => {
		cellRefs.current.get(id).onClick(e);
	};

	const addRelation = (relationKey: string, callBack?: (message: any) => void) => {
		const { targetId, blockId, view } = data;

		if (!view) {
			return;
		};

		Dataview.relationAdd(targetId, blockId, relationKey, view.relations.length, view, callBack);
	};

	const save = () => {
		const objectIds = getObjectIds();
		const operations: any[] = []; 

		for (const k in detailsRef.current) {
			const relation = S.Record.getRelationByKey(k);

			if (!relation) {
				continue;
			};

			if (Relation.isArrayType(relation.format) && (relation.format != I.RelationType.Select)) {
				const diff = Diff.diffArrays(initialRef.current[k] || [], detailsRef.current[k] || []);

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
				operations.push({ relationKey: k, set: Relation.formatValue(relation, detailsRef.current[k], true) });
			};
		};

		C.ObjectListModifyDetailValues(objectIds, operations, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
			} else {
				close();
			};
		});

		analytics.event('ChangeRelationValue', { id: 'Batch', count: objectIds.length });

		if (addRelationKeysRef.current.length && view) {
			const cb = () => {
				addRelationKeysRef.current.shift();
				if (!addRelationKeysRef.current.length) {
					return;
				};

				addRelation(addRelationKeysRef.current[0], cb);
			};

			addRelation(addRelationKeysRef.current[0], cb);
		};
	};

	useEffect(() => {
		loadObjects(() => initValues());

		return () => {
			S.Menu.closeAll(J.Menu.cell);
			U.Subscription.destroyList([ SUB_ID_OBJECT, SUB_ID_DEPS ]);
		};
	}, [ loadObjects, initValues ]);

	useEffect(() => {
		const id = S.Common.cellId;		
		if (id) {
			S.Common.cellId = '';
			
			const ref = cellRefs.current.get(id);
			if (ref) {
				ref.onClick($.Event('click'));
			};
		};
	});

	const objects = getObjects();
	const relations = getRelations();
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
						onClick={e => onCellClick(e, id)}
					>
						<Cell 
							ref={ref => cellRefs.current.set(id, ref)}
							rootId={SUB_ID_DEPS}
							subId={SUB_ID_DEPS}
							block={new M.Block({ id: '', type: I.BlockType.Relation, content: {} })}
							relationKey={item.relationKey}
							getRecord={() => detailsRef.current}
							viewType={I.ViewType.Grid}
							readonly={readonly}
							idPrefix={ID_PREFIX}
							onCellChange={onCellChange}
							getView={view ? (() => view): null}
							pageContainer={U.Common.getCellContainer('popupRelation')}
							menuParam={{ classNameWrap: 'fromPopup' }}
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
				<Button text="Save" className="c28" onClick={save} />
				<Button text="Cancel" className="c28" color="blank" onClick={() => close()} />
			</div>

			<Error text={error} />
		</div>
	);

}));

export default PopupRelation;
