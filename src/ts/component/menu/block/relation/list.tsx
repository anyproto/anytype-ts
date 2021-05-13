import * as React from 'react';
import { I, C, DataUtil, Util } from 'ts/lib';
import { Icon, Cell } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
	n: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const LIMIT = 40;

@observer
class MenuBlockRelationList extends React.Component<Props, State> {

	cellRefs: Map<string, any> = new Map();
	items: any[] = [];
	cache: any = {};

	state = {
		loading: false,
		n: 0,
	};

	constructor (props: any) {
		super(props);

	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, filter } = data;
		const { n } = this.state;
		const block = blockStore.getLeaf(rootId, rootId);
		const idPrefix = 'menuBlockRelationListCell';
		const items = this.getItems();

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const id = DataUtil.cellId(idPrefix, item.relationKey, '0');
			
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
					<div className={[ 'item', 'sides', (item.isHidden ? 'isHidden' : '') ].join(' ')} onClick={(e: any) => { this.onClick(e, item); }} style={param.style}>
						<div className="info">
							{item.name}
						</div>
						<div
							id={id} 
							className={[ 'cell', DataUtil.relationClass(item.format), 'canEdit' ].join(' ')} 
							onClick={(e: any) => { this.onClick(e, item); }}
						>
							<Cell 
								ref={(ref: any) => { this.cellRefs.set(id, ref); }} 
								rootId={rootId}
								storeId={rootId}
								block={block}
								relationKey={item.relationKey}
								getRecord={() => { return detailStore.get(rootId, rootId, [ item.relationKey ]); }}
								viewType={I.ViewType.Grid}
								index={0}
								idPrefix={idPrefix}
								menuClassName="fromBlock"
								scrollContainer={Util.getEditorScrollContainer('menuBlockRelationList')}
								pageContainer={Util.getEditorPageContainer('menuBlockRelationList')}
								readOnly={true}
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
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;

		let sections: any = {};
		let ret = [];
		let name = 'Create from scratch';
		let items = Util.objectCopy(this.items);
	
		if (!config.debug.ho) {
			items = items.filter((it: any) => { return !it.isHidden; });
		};

		items = items.filter((it: any) => { return Constant.relationSkipKeys.indexOf(it.relationKey) < 0; });

		sections[I.RelationScope.Object]				 = { id: I.RelationScope.Object, name: 'In this object', children: [] };
		sections[I.RelationScope.Type]					 = { id: I.RelationScope.Type, name: 'Type', children: [] };
		sections[I.RelationScope.SetOfTheSameType]		 = { id: I.RelationScope.SetOfTheSameType, name: 'Set of the same type', children: [] };
		sections[I.RelationScope.ObjectsOfTheSameType]	 = { id: I.RelationScope.ObjectsOfTheSameType, name: 'Objects of the same type', children: [] };
		sections[I.RelationScope.Library]				 = { id: I.RelationScope.Library, name: 'Library', children: [] };

		if (data.filter) {
			const filter = new RegExp(Util.filterFix(data.filter), 'gi');
			items = items.filter((it: any) => { return it.name.match(filter); });
			name = `Create relation "${data.filter}"`;
		};

		for (let item of items) {
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

		ret.unshift({ id: 'add', name: name });

		return ret;
	};

	onClick (e: any, item: any) {
		const { param, close, getId } = this.props;
		const { data } = param;
		const { onSelect } = data;

		if (item.id == 'add') {
			menuStore.open('blockRelationEdit', { 
				element: `#${getId()} #item-${item.id}`,
				data: {
					...data,
					addCommand: (rootId: string, blockId: string, relation: any) => {
						C.BlockRelationAdd(rootId, blockId, relation, () => { close(); });
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
		const height = Math.max(HEIGHT, Math.min(320, items.length * HEIGHT + 16));

		obj.css({ height: height });
		position();
	};

};

export default MenuBlockRelationList;