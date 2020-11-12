import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, C, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, dbStore } from 'ts/store';

import Controls from './dataview/controls';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class BlockDataview extends React.Component<Props, {}> {

	viewRef: any = null;

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.getData = this.getData.bind(this);
		this.getView = this.getView.bind(this);
		this.onRowAdd = this.onRowAdd.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
	};

	render () {
		const { block } = this.props;
		const { content } = block;
		const { source, views } = content;

		if (!views.length) {
			return null;
		};

		const { viewId } = dbStore.getMeta(block.id);
		const view = views.find((item: any) => { return item.id == (viewId || views[0].id); });
		const { type } = view;
		const readOnly = false; // TMP

		if (!view) {
			return null;
		};

		let ViewComponent: React.ReactType<I.ViewComponent>;
		switch (type) {
			default:
			case I.ViewType.Grid:
				ViewComponent = ViewGrid;
				break;
				
			case I.ViewType.Board:
				ViewComponent = ViewBoard;
				break;
				
			case I.ViewType.Gallery:
				ViewComponent = ViewGallery;
				break;
			
			case I.ViewType.List:
				ViewComponent = ViewList;
				break;
		};
		
		return (
			<div>
				<Controls 
					{...this.props} 
					readOnly={readOnly} 
					getData={this.getData} 
					getView={this.getView} 
					onRowAdd={this.onRowAdd}
				/>
				<div className="content">
					<ViewComponent 
						ref={(ref: any) => { this.viewRef = ref; }} 
						{...this.props} 
						onOpen={this.onOpen} 
						readOnly={readOnly} 
						getData={this.getData} 
						getView={this.getView} 
						onRowAdd={this.onRowAdd}
						onCellChange={this.onCellChange}
					/>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		$(window).unbind('resize.dataview').on('resize.dataview', () => { this.resize(); });
	};

	componentDidUpdate () {
		this.resize();

		$(window).trigger('resize.editor');
	};

	componentWillUnmount () {
		const { block } = this.props;

		$(window).unbind('resize.dataview');
		dbStore.relationsRemove(block.id);
	};

	getData (viewId: string, offset: number, callBack?: (message: any) => void) {
		const { rootId, block } = this.props;
		const win = $(window);

		dbStore.setMeta(block.id, { viewId: viewId, offset: offset });
		dbStore.setData(block.id, []);

		const view = this.getView();
		view.relations = DataUtil.viewGetRelations(block.id, view);

		C.BlockDataviewViewSetActive(rootId, block.id, viewId, offset, Constant.limit.dataview.records, callBack);

		commonStore.menuCloseAll();
		win.trigger('resize.editor');
	};

	getView () {
		const { block } = this.props;
		const { views } = block.content;

		if (!views.length) {
			return null;
		};

		const { viewId } = dbStore.getMeta(block.id);
		return views.find((item: any) => { return item.id == (viewId || views[0].id); });
	};

	onRowAdd (e: any) {
		const { rootId, block } = this.props;

		C.BlockDataviewRecordCreate(rootId, block.id, {}, (message: any) => {
			if (message.error.code) {
				return;
			};
			dbStore.recordAdd(block.id, message.record);
		});
	};

	onCellChange (id: string, key: string, value: any) {
		const { rootId, block } = this.props;
		const data = dbStore.getData(block.id);
		const record = data.find((it: any) => { return it.id == id; });

		if (!record || (record[key] === value)) {
			return;
		};

		let obj: any = { id: record.id };
		obj[key] = value;

		dbStore.recordUpdate(block.id, obj);
		C.BlockDataviewRecordUpdate(rootId, block.id, record.id, record);
	};

	onOpen (e: any, data: any) {
		DataUtil.pageOpenPopup(data.id);
	};

	resize () {
		if (this.viewRef && this.viewRef.resize) {
			this.viewRef.resize();
		};
	};
	
};

export default BlockDataview;