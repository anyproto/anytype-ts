import * as React from 'react';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Filter, Select, Icon, Button } from 'Component';
import { I, U, J, S, translate } from 'Lib';

interface State {
	isLoading: boolean;
};

const LIMIT = 20;
const HEIGHT = 64;

const SidebarObject = observer(class SidebarObject extends React.Component<{}, State> {
	
	state = {
		isLoading: false,
	};
	cache: any = {};
	offset = 0;
	refList: any = null;

    render() {
		const { isLoading } = this.state;
		const items = this.getItems();
		const sortOptions = U.Menu.getStoreSortOptions(I.StoreTab.Type, I.StoreView.Library);

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<div style={param.style} className="item">

					</div>
				</CellMeasurer>
			);
		};

        return (
			<React.Fragment>
				<div className="head">
					<Title text="Library" />

					<div className="sides sidesSort">
						<div className="side left">
							<Select id="containerObjectsSelect" value="" options={sortOptions} />
						</div>
						<div className="side right">
							<Icon className="sort" />
						</div>
					</div>

					<div className="sides sidesFilter">
						<div className="side left">
							<Filter 
								icon="search"
								placeholder={translate('commonSearch')}
							/>
						</div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate('commonNew')} />
						</div>
					</div>
				</div>

				<div className="body">
					{this.cache && items.length && !isLoading ? (
						<div className="items">
							<InfiniteLoader
								rowCount={items.length + 1}
								loadMoreRows={this.loadMoreRows}
								isRowLoaded={({ index }) => !!items[index]}
								threshold={LIMIT}
							>
								{({ onRowsRendered }) => (
									<AutoSizer className="scrollArea">
										{({ width, height }) => (
											<List
												ref={ref => this.refList = ref}
												width={width}
												height={height}
												deferredMeasurmentCache={this.cache}
												rowCount={items.length}
												rowHeight={HEIGHT}
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
					) : ''}
				</div>
			</React.Fragment>
		);
    };

	componentDidMount () {
		this.load(true);
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		U.Data.searchSubscribe({
			subId: J.Constant.subId.allObject,
			filters: [],
			sorts: [],
			limit: 100,
			ignoreHidden: true,
			ignoreDeleted: true,
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	getItems () {
		return S.Record.getRecords(J.Constant.subId.allObject);
	};

});

export default SidebarObject;