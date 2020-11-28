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
const { ipcRenderer } = window.require('electron');

@observer
class BlockDataview extends React.Component<Props, {}> {

	viewRef: any = null;
	cellRefs: Map<string, any> = new Map();

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.getData = this.getData.bind(this);
		this.getRecord = this.getRecord.bind(this);
		this.getView = this.getView.bind(this);
		this.onRowAdd = this.onRowAdd.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
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
					getRecord={this.getRecord}
					onRowAdd={this.onRowAdd}
				/>
				<div className="content">
					<ViewComponent 
						ref={(ref: any) => { this.viewRef = ref; }} 
						onRef={(ref: any, id: string) => { this.cellRefs.set(id, ref); }} 
						{...this.props} 
						onOpen={this.onOpen} 
						readOnly={readOnly} 
						getData={this.getData} 
						getRecord={this.getRecord}
						getView={this.getView} 
						onRowAdd={this.onRowAdd}
						onCellClick={this.onCellClick}
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

	getData (id: string, offset: number, callBack?: (message: any) => void) {
		const { rootId, block } = this.props;
		const win = $(window);
		const { viewId } = dbStore.getMeta(block.id);

		dbStore.metaSet(block.id, { viewId: id, offset: offset });
		if (id != viewId) {
			dbStore.recordsSet(block.id, []);
		};

		C.BlockDataviewViewSetActive(rootId, block.id, id, offset, Constant.limit.dataview.records, callBack);

		commonStore.menuCloseAll();
		win.trigger('resize.editor');
	};

	getRecord (index: number) {
		const { block } = this.props;
		const data = dbStore.getData(block.id);

		return data[index];
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

	onCellClick (e: any, key: string, index: number) {
		const view = this.getView();
		const relation = view.relations.find((it: any) => { return it.key == key; });

		if (relation.isReadOnly) {
			return;
		};

		const id = DataUtil.cellId('cell', key, index);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, key: string, value: any) {
		const { rootId, block } = this.props;
		const data = dbStore.getData(block.id);
		const record = data.find((it: any) => { return it.id == id; });

		if (!record || (JSON.stringify(record[key]) === JSON.stringify(value))) {
			return;
		};

		let obj: any = { id: record.id };
		obj[key] = value;

		dbStore.recordUpdate(block.id, obj);
		C.BlockDataviewRecordUpdate(rootId, block.id, record.id, record);
	};

	onOpen (e: any, data: any, type: string) {
		switch (type) {
			default:
				DataUtil.pageOpenPopup(data.id);
				break;

			case 'image':
				commonStore.popupOpen('preview', {
					data: {
						type: I.FileType.Image,
						url: commonStore.imageUrl(data.id, Constant.size.image),
					}
				});
				break;

			case 'file':
				ipcRenderer.send('urlOpen', commonStore.fileUrl(data.id));
				break;
		};
	};

	resize () {
		if (this.viewRef && this.viewRef.resize) {
			this.viewRef.resize();
		};
	};
	
};

export default BlockDataview;