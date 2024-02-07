import * as React from 'react';
import { I, C } from 'Lib';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';

const HEIGHT = 450;

class PopupUsecasePageList extends React.Component<I.PopupUsecase> {

	node = null;
	refList = null;
	list: any = [];
	categories: any = [];
	cache: any = {};

	constructor (props: I.PopupUsecase) {
		super(props);
	};
	
	render () {
		const Item = (item: any) => {
			const screenshot = item.screenshots.length ? item.screenshots[0] : '';

			return (
				<div className="item" onClick={e => this.onClick(e, item)}>
					<div className="picture" style={{ backgroundImage: `url("${screenshot}")` }}></div>
					<div className="name">{item.title}</div>
					<div className="descr">{item.description}</div>
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item: any = this.list[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<Item key={item.id} {...item} index={param.index} style={param.style} />
				</CellMeasurer>
			);
		};

		return (
			<div ref={ref => this.node = ref}>
				<div className="items">
					{this.list.map((item: any) => (
						<Item key={item.id} {...item} />
					))}
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
										rowCount={length}
										rowHeight={HEIGHT}
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
		C.DownloadGalleryIndex((message: any) => {
			this.categories = message.categories;
			this.list = message.list;
			this.forceUpdate();
		});
	};

	componentDidUpdate (): void {
		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => this.list[i].id,
		});

		this.props.position();	
	};

	onClick (e: any, item: any) {
		this.props.onPage('item', { object: item });
	};

};

export default PopupUsecasePageList;