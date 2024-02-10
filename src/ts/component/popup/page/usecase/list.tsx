import * as React from 'react';
import { Loader, Title, Label } from 'Component';
import { I, C, translate } from 'Lib';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';

interface State {
	isLoading: boolean;
};

const HEIGHT = 450;

class PopupUsecasePageList extends React.Component<I.PopupUsecase, State> {

	node = null;
	refList = null;
	list: any = [];
	categories: any = [];
	cache: any = {};
	columnCount = 0;
	state = {
		isLoading: false
	};

	constructor (props: I.PopupUsecase) {
		super(props);

		this.cache = new CellMeasurerCache({
			defaultHeight: HEIGHT,
			fixedWidth: true,
		});
	};
	
	render () {
		const { getAuthor, onAuthor } = this.props;
		const { isLoading } = this.state;
		const items = this.getItems();

		if (isLoading) {
			return <Loader id="loader" />;
		};

		const Category = (item: any) => (
			<div className="item">
				{item.name}
			</div>
		);

		const Item = (item: any) => {
			const screenshot = item.screenshots.length ? item.screenshots[0] : '';

			return (
				<div className="item" onClick={e => this.onClick(e, item)}>
					<div className="picture" style={{ backgroundImage: `url("${screenshot}")` }}></div>
					<div className="name">{item.title}</div>
					<div className="descr">{item.description}</div>
					<div className="author" onClick={() => onAuthor(item.author)}>@{getAuthor(item.author)}</div>
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					{({ measure }) => (
						<div key={`gallery-row-${param.index}`} className="row" style={param.style}>
							{item.children.map(child => <Item key={child.id} {...child} />)}
						</div>
					)}
				</CellMeasurer>
			);
		};

		return (
			<div ref={ref => this.node = ref} className="wrap">
				<div className="categories">
					<div className="inner">
						{this.categories.map((item: any, i: number) => (
							<Category key={i} {...item} />
						))}
					</div>
				</div>

				<div className="mid">
					<Title text={translate('popupUsecaseListTitle')} />
					<Label text={translate('popupUsecaseListText')} />
				</div>

				<div className="items">
					<WindowScroller scrollElement={$('#popupUsecase-innerWrap').get(0)}>
						{({ height, isScrolling, registerChild, scrollTop }) => (
							<AutoSizer disableHeight={true} className="scrollArea">
								{({ width }) => (
									<List
										ref={ref => this.refList = ref}
										autoHeight={true}
										height={Number(height) || 0}
										width={Number(width) || 0}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={param => this.cache.rowHeight(param)}
										rowRenderer={rowRenderer}
										isScrolling={isScrolling}
										scrollTop={scrollTop}
									/>
								)}
							</AutoSizer>
						)}
					</WindowScroller>
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		this.setState({ isLoading: true });

		C.GalleryDownloadIndex((message: any) => {
			this.categories = message.categories || [];
			this.list = message.list || [];
			
			this.setState({ isLoading: false });
		});
	};

	componentDidUpdate (): void {
		this.reset();
		this.props.position();	
	};

	reset () {
		this.cache.clearAll();

		if (this.refList) {
			this.refList.recomputeRowHeights(0);
		};
	};

	onClick (e: any, item: any) {
		this.props.onPage('item', { object: item });
	};

	getItems () {
		const ret: any[] = [];

		let n = 0;
		let row = { children: [] };

		for (const item of this.list) {
			row.children.push(item);

			n++;
			if (n == 2) {
				ret.push(row);
				row = { children: [] };
				n = 0;
			};
		};

		if (row.children.length < this.columnCount) {
			ret.push(row);
		};

		return ret.filter(it => it.children.length > 0);
	};

};

export default PopupUsecasePageList;