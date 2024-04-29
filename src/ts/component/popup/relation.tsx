import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Cell, Error } from 'Component';
import { I, M, C, UtilCommon, Relation, UtilData } from 'Lib';
import { dbStore, commonStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

const ID_PREFIX = 'popupRelation';

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
	};

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { subId, readonly } = data;
		const { error } = this.state;
		const objects = this.getObjects();
		const relations = this.getRelations();

		const Item = (item: any) => {
			const id = Relation.cellId(ID_PREFIX, item.relationKey, subId);
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
								rootId={subId}
								subId={subId}
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
				<Title text="Relation batch editing" />
				<Label text={UtilCommon.sprintf(`You are editing %d objects`, objects.length)} />

				<div className="blocks">
					{relations.map(item => <Item key={item.relationKey} {...item} />)}
				</div>

				<div className="buttons">
					<Button text="Save" className="c36" onClick={this.save} />
					<Button text="Cancel" className="c36" color="blank" onClick={() => close()} />
				</div>

				<Error text={error} />
			</div>
		);
	};

	componentDidMount(): void {
		this.load(() => {
			this.initValues();
			this.forceUpdate();
		});
	};

	load (callBack: () => void) {
		const { param } = this.props;
		const { data } = param;
		const { objectIds } = data;
		const relationKeys = this.getRelationKeys();

		UtilData.subscribeIds ({
			subId: ID_PREFIX,
			ids: objectIds,
			keys: relationKeys,
			noDeps: false,
		}, callBack);
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
	};

	getRelationKeys (): string[] {
		return this.props.param.data.relationKeys || Constant.defaultRelationKeys;
	};

	getRelations (): any[] {
		const { config } = commonStore;

		let ret = this.getRelationKeys().map(relationKey => dbStore.getRelationByKey(relationKey));

		ret = ret.filter(it => {
			return (config.debug.hiddenObject ? true : !it.isHidden) && !it.isReadonlyValue || (it.relationKey == 'name');
		});
		ret = ret.sort(UtilData.sortByName);
		return ret;
	};

	getObjects () {
		return dbStore.getRecords(ID_PREFIX, this.getRelationKeys());
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		this.details[relationKey] = Relation.formatValue(dbStore.getRelationByKey(relationKey), value, true);
		this.forceUpdate();
	};

	onCellClick (e: any, id: string) {
		this.cellRefs.get(id).onClick(e);
	};

	save () {
		const { param, close } = this.props;
		const { data } = param;
		const { objectIds } = data;
		const details: any[] = []; 

		for (const k in this.details) {
			details.push({ key: k, value: this.details[k] });
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
