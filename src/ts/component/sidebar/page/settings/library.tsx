import * as React from 'react';
import { observer } from 'mobx-react';
import { analytics, I, J, keyboard, Relation, S, sidebar, translate, U } from 'Lib';
import { Icon, IconObject, ObjectName } from 'Component';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends React.Component {
	page: string;
};

const LIMIT = 30;
const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 38;
const HEIGHT_SECTION_FIRST = 34;

const SidebarSettingsLibrary = observer(class SidebarSettingsLibrary extends React.Component<Props, {}> {

	node: any = null;
	cache: any = {};

	render () {
		const space = U.Space.getSpaceview();
		const profile = U.Space.getProfile();
		const participant = U.Space.getParticipant() || profile;
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const items = this.getItems();

		const ItemSection = (item: any) => {
			const cn = [ 'section' ];

			if (item.isFirst) {
				cn.push('isFirst');
			};

			return (
				<div className={cn.join(' ')}>
					<div className="name">{item.name}</div>
				</div>
			);
		};

		const Item = (item: any) => {
			if (item.isSection) {
				return <ItemSection {...item} />;
			};

			const cn = [ 'item', 'isTypeOrRelation' ];

			if (item.id == param?.objectId) {
				cn.push('active');
			};

			return (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={() => this.onClick(item)}
				>
					<IconObject object={item} />

					<div className="name">{item.name}</div>
				</div>
			);
		};

		const rowRenderer = ({ index, key, parent, style }) => (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={this.cache}
				columnIndex={0}
				rowIndex={index}
			>
				<div className="row" style={style}>
					<Item {...items[index]} />
				</div>
			</CellMeasurer>
		);

		let title = '';
		if (this.props.page == 'types') {
			title = U.Common.plural(10, translate('pluralObjectType'));
		} else {
			title = U.Common.plural(10, translate('pluralProperty'));
		};

		return (
			<div
				ref={ref => this.node = ref}
				id="containerSettings"
				className="spaceSettings"
			>
				<div className="head" />

				<div className="body">
					<div className="list">
						<div className="head" onClick={() => sidebar.leftPanelSetState({ page: 'settingsSpace' })}>
							<Icon className="back withBackground" />
							{title}
						</div>

						<div className="inner">
							<InfiniteLoader
								rowCount={items.length}
								loadMoreRows={() => {}}
								isRowLoaded={() => true}
								threshold={LIMIT}
							>
								{({ onRowsRendered }) => (
									<AutoSizer className="scrollArea">
										{({ width, height }) => (
											<List
												width={width}
												height={height}
												deferredMeasurmentCache={this.cache}
												rowCount={items.length}
												rowHeight={({ index }) => this.getRowHeight(items[index])}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						</div>
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i]),
			keyMapper: i => (items[i] || {}).id,
		});
	};

	getItems () {
		const sections = this.props.page == 'types' ? this.getTypes() : this.getRelations();

		let items: any[] = [];

		sections.forEach((section, idx) => {
			if (section.name) {
				const item: any = { id: section.id, name: section.name, isSection: true };

				if (idx == 0) {
					item.isFirst = true;
				};

				items.push(item);
			};

			let children = section.children ? section.children : [];

			items = items.concat(children);
		});

		return items;
	};
	
	getTypes (): any[] {
		const data = S.Record.checkHiddenObjects(S.Record.getTypes());

		return [
			{ id: 'installed', name: 'Installed', children: data.filter(it => it.isInstalled && !U.Object.isInSystemLayouts(it.recommendedLayout)) },
			{ id: 'system', name: 'System', children: data.filter(it => U.Object.isInSystemLayouts(it.recommendedLayout)) },
		];
	};

	getRelations (): any[] {
		const data = S.Record.checkHiddenObjects(S.Record.getRelations());
		const systemKeys = Relation.systemKeys();

		return [
			{ id: 'installed', name: 'Installed', children: data.filter(it => it.isInstalled && !systemKeys.includes(it.relationKey)) },
			{ id: 'system', name: 'System', children: data.filter(it => systemKeys.includes(it.relationKey)) },
		];
	};

	getRowHeight (item: any) {
		if (item.isSection) {
			return item.isFirst ? HEIGHT_SECTION_FIRST : HEIGHT_SECTION;
		};
		return HEIGHT_ITEM;
	};

	onClick (item) {
		const param = {
			layout: I.ObjectLayout.Settings,
			id: U.Object.actionByLayout(item.layout),
			_routeParam_: {
				additional: [
					{ key: 'objectId', value: item.id }
				],
			},
		};

		U.Object.openAuto(param);
	};

	onAdd (e, item) {
		e.preventDefault();
		e.stopPropagation();

		const isPopup = keyboard.isPopup();

		switch (item.id) {
			case 'types': {
				const type = S.Record.getTypeType();
				const featured = [ 'type', 'tag', 'backlinks' ];
				const recommended = [];
				const mapper = it => S.Record.getRelationByKey(it)?.id;
				const details: any = {
					isNew: true,
					type: type.id,
					layout: I.ObjectLayout.Type,
					recommendedFeaturedRelations: featured.map(mapper).filter(it => it),
					recommendedRelations: recommended.map(mapper).filter(it => it),
					defaultTypeId: String(S.Record.getPageType()?.id || ''),
				};

				sidebar.rightPanelToggle(true, true, isPopup, 'type', { details });
				break;
			};

			case 'relations': {
				const node = $(this.node);
				const width = node.width() - 32;

				S.Menu.open('blockRelationEdit', {
					element: `#containerSettings #item-toggle-${item.id} .plus`,
					offsetY: 4,
					width,
					className: 'fixed',
					classNameWrap: 'fromSidebar',
					horizontal: I.MenuDirection.Right,
				});

				break;
			};
		};
	};

});

export default SidebarSettingsLibrary
