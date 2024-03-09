import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Icon, Label, Button, Cell } from 'Component';
import { I, M, translate, UtilCommon, Relation, UtilData } from 'Lib';
import { dbStore, detailStore, commonStore } from 'Store';

const ID_PREFIX = 'popupRelation';

const PopupRelation = observer(class PopupRelation extends React.Component<I.Popup> {

	cellRefs: Map<string, any> = new Map();
	details: any = {};

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
		const items = this.getItems();

		const Item = (item: any) => {
			const id = Relation.cellId(ID_PREFIX, item.relationKey, subId);
			const allowedValue = !item.isReadonlyValue;

			return (
				<div className="block blockRelation">
					<div className="sides">
						<div className="info">
							{!allowedValue ? <Icon className="lock" /> : ''}
							<div className="name">{item.name}</div>
						</div>
						<div 
							id={id} 
							className={[ 'cell', Relation.className(item.format), (!readonly && allowedValue ? 'canEdit' : '') ].join(' ')} 
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
								readonly={readonly || !allowedValue}
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

				<div className="blocks">
					{items.map(item => <Item key={item.relationKey} {...item} />)}
				</div>

				<div className="buttons">
					<Button text="Save" onClick={this.save} />
					<Button text="Cancel" color="blank" onClick={close} />
				</div>
			</div>
		);
	};

	getItems (): any[] {
		const { space, config } = commonStore;

		const relations = UtilCommon.objectCopy(dbStore.getRelations()).filter(it => {
			let ret = !config.debug.ho ? !it.isHidden : true;
			if ((it.spaceId != space) || it.isReadonlyValue) {
				ret = false;
			};
			return ret;
		});

		return relations.sort(UtilData.sortByName);
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		this.details[relationKey] = Relation.formatValue(dbStore.getRelationByKey(relationKey), value, true);
		this.forceUpdate();
	};

	onCellClick (e: any, id: string) {
		this.cellRefs.get(id).onClick(e);
	};

	save () {
	};

});

export default PopupRelation;
