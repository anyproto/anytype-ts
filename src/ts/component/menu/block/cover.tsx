import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, analytics } from 'ts/lib';
import { Cover, Filter, Icon, Label } from 'ts/component';
import { detailStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

enum Tab {
	Gallery	 = 0,
	Unsplash = 1,
	Library	 = 2,
	Upload	 = 3,
};

interface State {
	filter: string;
	tab: Tab;
	loading: boolean;
};

const { dialog } = window.require('@electron/remote');
const Constant = require('json/constant.json');
const $ = require('jquery');

const LIMIT = 36;

const MenuBlockCover = observer(class MenuBlockCover extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		filter: '',
		tab: Tab.Gallery,
		loading: false,
	};
	items: any[] = [];
	filter: string = '';
	refFilter: any = null;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
	};

	render () {
		const { filter, tab } = this.state;
		const tabs: any[] = [
			{ id: Tab.Gallery, name: 'Gallery' },
			{ id: Tab.Unsplash, name: 'Unsplash' },
			{ id: Tab.Library, name: 'Library' },
			{ id: Tab.Upload, name: 'Upload' },
		].filter(it => it);

		const Item = (item: any) => (
			<div className="item" onClick={(e: any) => { this.onSelect(e, item); }}>
				<Cover preview={true} {...item} />
				{item.artist ? <div className="name">{item.artist}</div> : ''}
			</div>
		);

		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);

		let content = null;
		switch (tab) {
			case Tab.Gallery:
				const sections = this.getSections();

				content = (
					<div className="sections">
						{sections.map((section: any, i: number) => (
							<Section key={i} {...section} />
						))}
					</div>
				);
				break;

			case Tab.Unsplash:
			case Tab.Library:
				content = (
					<React.Fragment>
						<Filter 
							ref={(ref: any) => { this.refFilter = ref; }}
							value={filter}
							onChange={this.onFilterChange} 
						/>

						<div className="sections">
							<div className="section">
								<div className="items">
									{this.items.map((item: any, i: number) => (
										<Item key={i} {...item} />
									))}
								</div>
							</div>
						</div>
						
					</React.Fragment>
				);
				break;

			case Tab.Upload:
				content = (
					<div 
						className="dropzone" 
						onDragOver={this.onDragOver} 
						onDragLeave={this.onDragLeave} 
						onDrop={this.onDrop}
						onClick={this.onUpload}
					>
						<Icon className="coverUpload" />
						<Label text="Choose Image or <span>Drag it here</span>" />
					</div>
				);
				break;
		};

		return (
			<div className="wrap">
				<div className="head">
					{tabs.map((item: any, i: number) => (
						<div 
							key={item.id} 
							className={[ 'btn', (item.id == tab ? 'active' : '') ].join(' ')}
							onClick={() => { this.setTab(item.id); }}
						>
							{item.name}
						</div>
					))}
				</div>

				<div className={[ 'body', Tab[tab].toLowerCase() ].join(' ')}>
					{content}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.load();
	};

	componentDidUpdate () {
		const { filter } = this.state;
		
		if (this.filter != filter) {
			this.filter = filter;
			this.load();
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	load () {
		const { filter, tab } = this.state;

		this.items = [];

		switch (tab) {
			case Tab.Unsplash:
				C.UnsplashSearch(filter, LIMIT, (message: any) => {
					if (message.error.code) {
						return;
					};

					message.pictures.forEach((item: any) => {
						this.items.push({
							id: item.id,
							type: I.CoverType.Source,
							src: item.url,
							artist: item.artist,
						});
					});

					this.forceUpdate();
				});
				break;

			case Tab.Library:
				const filters: I.Filter[] = [
					{ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Empty, value: null },
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.image },
					{ operator: I.FilterOperator.And, relationKey: 'widthInPixels', condition: I.FilterCondition.GreaterOrEqual, value: Constant.size.cover },
					{ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false },
					{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
					{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
				];
				const sorts = [ 
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
				];

				C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, 0, 300, (message: any) => {
					message.records.forEach((item: any) => {
						this.items.push({
							id: item.id,
							type: I.CoverType.Upload,
							src: commonStore.imageUrl(item.id, 150),
							artist: item.name,
						});
					});
					this.forceUpdate();
				});
				break;
		};
	};

	setTab (tab: Tab) {
		this.state.tab = tab;
		this.setState({ tab });
		this.load();
	};

	onUpload (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onUpload, onUploadStart } = data;
		const options: any = {
			properties: [ 'openFile' ],
			filters: [ { name: '', extensions: Constant.extension.cover } ]
		};

		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};

			this.props.close();

			if (onUploadStart) {
				onUploadStart();
			};

			C.FileUpload('', files[0], I.FileType.Image, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (onUpload) {
					onUpload(I.CoverType.Upload, message.hash);
				};

				analytics.event('SetCover', { type: I.CoverType.Upload });
			});
		});
	};

	onSelect (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, onSelect, onUpload, onUploadStart } = data;
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys, true);

		if (!object.coverId) {
			close();
		};

		if (item.type == I.CoverType.Source) {
			if (onUploadStart) {
				onUploadStart();
			};

			C.UnsplashDownload(item.id, (message: any) => {
				if (!message.error.code) {
					onUpload(item.type, message.hash);
				};
			});

			close();
		} else
		if (onSelect) {
			onSelect(item);
		};

		analytics.event('SetCover', { type: item.type, id: item.id });
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { this.setState({ filter: v }); }, 500);
	};

	getSections () {
		return [
			{ name: 'Gradients', children: DataUtil.coverGradients() },
			{ name: 'Solid colors', children: DataUtil.coverColors() },
		];
	};

	onDragOver (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const zone = node.find('.dropzone');

		zone.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const zone = node.find('.dropzone');

		zone.removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const { dataset, param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { preventCommonDrop } = dataset || {};
		const file = e.dataTransfer.files[0].path;
		const node = $(ReactDOM.findDOMNode(this));
		const zone = node.find('.dropzone');
		
		zone.removeClass('isDraggingOver');
		preventCommonDrop(true);
		this.setState({ loading: true });
		
		C.FileUpload('', file, I.FileType.Image, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (!message.error.code) {
				DataUtil.pageSetCover(rootId, I.CoverType.Upload, message.hash);
			};
		
			close();
		});
	};

});

export default MenuBlockCover;