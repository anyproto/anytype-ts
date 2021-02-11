import * as React from 'react';
import { I, C, DataUtil, Util } from 'ts/lib';
import { Icon, Cell } from 'ts/component';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
	n: number;
};

const $ = require('jquery');
const HEIGHT = 28;
const LIMIT = 40;
const PREFIX = 'menuBlockRelationViewCell';

@observer
class MenuBlockRelationView extends React.Component<Props, State> {

	cellRefs: Map<string, any> = new Map();
	items: any[] = [];
	cache: any = {};

	state = {
		loading: false,
		n: 0,
	};

	constructor (props: any) {
		super(props);

		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.optionCommand = this.optionCommand.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { n } = this.state;
		const block = blockStore.getLeaf(rootId, rootId);
		const details = blockStore.getDetails(rootId, rootId);
		const items = this.getItems();

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const id = DataUtil.cellId(PREFIX, item.relationKey, '0');
			
			let content = null;
			if (item.id == 'add') {
				content =  (
					<div id="item-add" className="item add" onClick={(e: any) => { this.onClick(e, item); }} style={param.style}>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else 
			if (item.isSection) {
				content = (<div className="sectionName" style={param.style}>{item.name}</div>);
			} else {
				content = (
					<div className="item sides" style={param.style}>
						<div className="info">
							<Icon className={'relation ' + DataUtil.relationClass(item.format)} />
							{item.name}
						</div>
						<div
							id={id} 
							className={[ 'cell', DataUtil.relationClass(item.format), 'canEdit' ].join(' ')} 
							onClick={(e: any) => { this.onCellClick(e, item.relationKey, 0); }}
						>
							<Cell 
								ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
								rootId={rootId}
								storeId={rootId}
								block={block}
								relationKey={item.relationKey}
								getRecord={() => { return details; }}
								viewType={I.ViewType.Grid}
								index={0}
								idPrefix={PREFIX}
								menuClassName="fromBlock"
								scrollContainer={Util.getEditorScrollContainer('menu')}
								pageContainer={Util.getEditorPageContainer('menu')}
								readOnly={false}
								onCellChange={this.onCellChange}
								optionCommand={this.optionCommand}
							/>
						</div>
					</div>
				);
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="items">
				<InfiniteLoader
					rowCount={items.length}
					loadMoreRows={() => {}}
					isRowLoaded={() => { return true; }}
					threshold={LIMIT}
				>
					{({ onRowsRendered, registerChild }) => (
						<AutoSizer className="scrollArea">
							{({ width, height }) => (
								<List
									ref={registerChild}
									width={width}
									height={height}
									deferredMeasurmentCache={this.cache}
									rowCount={items.length}
									rowHeight={HEIGHT}
									rowRenderer={rowRenderer}
									onRowsRendered={onRowsRendered}
									overscanRowCount={10}
									scrollToIndex={n}
								/>
							)}
						</AutoSizer>
					)}
				</InfiniteLoader>
			</div>
		);
	};

	componentDidMount () {
		this.load();
		this.resize();

		$('body').addClass('over');
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
	};

	componentWillUnmount () {
		commonStore.menuCloseAll();
		$('body').removeClass('over');
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		this.setState({ loading: true });

		C.ObjectRelationListAvailable(rootId, (message: any) => {
			this.items = message.relations.sort(DataUtil.sortByName);
			this.setState({ loading: false });
		});
	};

	getItems (): I.SelectOption[] {
		const { param } = this.props;
		const { data } = param;

		let sections: any = {};
		let ret = [];
		let name = 'Create from scratch';

		sections[I.RelationScope.Object]				 = { id: I.RelationScope.Object, name: 'In this object', children: [] };
		sections[I.RelationScope.Type]					 = { id: I.RelationScope.Type, name: 'Type', children: [] };
		sections[I.RelationScope.SetOfTheSameType]		 = { id: I.RelationScope.SetOfTheSameType, name: 'Set of the same type', children: [] };
		sections[I.RelationScope.ObjectsOfTheSameType]	 = { id: I.RelationScope.ObjectsOfTheSameType, name: 'Objects of the same type', children: [] };
		sections[I.RelationScope.Library]				 = { id: I.RelationScope.Library, name: 'Library', children: [] };

		if (data.filter) {
			const filter = new RegExp(Util.filterFix(data.filter), 'gi');
			this.items = this.items.filter((it: any) => { return it.name.match(filter); });
			name = `Create relation "${data.filter}"`;
		};

		for (let item of this.items) {
			if (!sections[item.scope]) {
				continue;
			};
			sections[item.scope].children.push(item);
		};

		for (let i in sections) {
			let section = sections[i];
			if (!section.children.length) {
				continue;
			};
			ret.push({ id: section.id, name: section.name, isSection: true });
			ret = ret.concat(section.children);
		};

		ret = ret.filter((it: I.Relation) => { return !it.isHidden; });
		ret.push({ id: 'add', name: name });

		return ret;
	};

	onClick (e: any, item: any) {
		const { param, close, getId } = this.props;
		const { data } = param;
		const { onSelect } = data;

		if (item.id == 'add') {
			commonStore.menuOpen('blockRelationEdit', { 
				type: I.MenuType.Vertical,
				element: `#${getId()} #item-${item.id}`,
				offsetX: 0,
				offsetY: 0,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Left,
				data: {
					...data,
					onChange: (message: any) => { 
						if (message.error.code) {
							return;
						};

						close();
					},
				}
			});
		} else 
		if (onSelect) {
			close();
			onSelect(item);
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $('#' + getId() + ' .content');
		const win = $(window);
		const height = Math.max(HEIGHT, Math.min(win.height() - 56, items.length * HEIGHT + 16));

		obj.css({ height: height });
		position();
	};

	onCellClick (e: any, relationKey: string, index: number) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, readOnly } = data;
		const relation = dbStore.getRelation(rootId, rootId, relationKey);

		if (!relation || readOnly || relation.isReadOnly) {
			return;
		};

		const id = DataUtil.cellId(PREFIX, relationKey, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, key: string, value: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		C.BlockSetDetails(rootId, [ 
			{ key: key, value: value },
		]);
	};

	optionCommand (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: I.SelectOption, callBack?: (message: any) => void) {
		switch (code) {
			case 'add':
				C.ObjectRelationOptionAdd(rootId, relationKey, option, callBack);
				break;

			case 'update':
				C.ObjectRelationOptionUpdate(rootId, relationKey, option, callBack);
				break;

			case 'delete':
				C.ObjectRelationOptionDelete(rootId, relationKey, option.id, callBack);
				break;
		};
	};

};

export default MenuBlockRelationView;