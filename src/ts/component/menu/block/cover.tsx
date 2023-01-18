import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { I, C, DataUtil, analytics, Util, translate, ObjectUtil } from 'Lib';
import { Cover, Filter, Icon, Label, EmptySearch, Loader } from 'Component';
import { detailStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

enum Tab {
	Gallery	 = 0,
	Unsplash = 1,
	Library	 = 2,
	Upload	 = 3,
};

interface State {
	filter: string;
	loading: boolean;
};

const LIMIT = 36;

const MenuBlockCover = observer(class MenuBlockCover extends React.Component<I.Menu, State> {

	_isMounted: boolean = false;
	node: any = null;
	state = {
		filter: '',
		loading: false,
	};
	items: any[] = [];
	filter: string = '';
	refFilter: any = null;
	timeout: number = 0;
	tab: Tab = Tab.Gallery;

	constructor (props: I.Menu) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
	};

	render () {
		const { filter, loading } = this.state;
		const tabs: any[] = [
			{ id: Tab.Gallery, name: 'Gallery' },
			{ id: Tab.Unsplash, name: 'Unsplash' },
			{ id: Tab.Library, name: 'Library' },
			{ id: Tab.Upload, name: 'Upload' },
		].filter(it => it);
		const sections = this.getSections();

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
		let filterElement = null;

		if ([ Tab.Unsplash, Tab.Library ].includes(this.tab)) {
			filterElement = (
				<Filter 
					ref={(ref: any) => { this.refFilter = ref; }}
					value={filter}
					onChange={this.onFilterChange} 
				/>
			);
		};

		switch (this.tab) {
			case Tab.Gallery:
			case Tab.Unsplash:
			case Tab.Library: {
				content = (
					<React.Fragment>
						{sections.length ? (
							<div className="sections">
								{sections.map((section: any, i: number) => (
									<Section key={i} {...section} />
								))}
							</div>
						) : <EmptySearch text={filter ? Util.sprintf(translate('menuBlockCoverEmptyFilter'), filter) : translate('menuBlockCoverEmpty')} />}
					</React.Fragment>
				);
				break;
			};

			case Tab.Upload: {
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
		};

		if (loading) {
			content = <Loader />;
		};

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="head">
					{tabs.map((item: any, i: number) => (
						<div 
							key={item.id} 
							className={[ 'btn', (item.id == this.tab ? 'active' : '') ].join(' ')}
							onClick={() => { this.setTab(item.id); }}
						>
							{item.name}
						</div>
					))}
				</div>

				<div className={[ 'body', Tab[this.tab].toLowerCase() ].join(' ')}>
					{filterElement}
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
		const { filter } = this.state;

		this.items = [];

		if (![ Tab.Unsplash, Tab.Library ].includes(this.tab)) {
			this.setState({ loading: false });
			return;
		};

		switch (this.tab) {
			case Tab.Unsplash: {
				this.setState({ loading: true });

				C.UnsplashSearch(filter, LIMIT, (message: any) => {
					if (message.error.code) {
						this.setState({ loading: false });
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

					this.setState({ loading: false });
				});
				break;
			};

			case Tab.Library: {
				const filters: I.Filter[] = [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.image },
					{ operator: I.FilterOperator.And, relationKey: 'widthInPixels', condition: I.FilterCondition.GreaterOrEqual, value: 1000 },
					{ operator: I.FilterOperator.And, relationKey: 'heightInPixels', condition: I.FilterCondition.GreaterOrEqual, value: 500 },
				];
				const sorts = [ 
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
				];

				this.setState({ loading: true });

				DataUtil.search({
					filters,
					sorts,
					fullText: filter,
					limit: 300,
				}, (message: any) => {
					if (message.error.code) {
						this.setState({ loading: false });
						return;
					};

					message.records.forEach((item: any) => {
						this.items.push({
							id: item.id,
							type: I.CoverType.Upload,
							src: commonStore.imageUrl(item.id, 150),
							artist: item.name,
							coverY: -0.25,
						});
					});

					this.setState({ loading: false });
				});
				break;
			};
		};
	};

	setTab (tab: Tab) {
		this.tab = tab;
		this.forceUpdate();
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

		window.Electron.showOpenDialog(options).then((result: any) => {
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
		let sections: any[] = [];
		switch (this.tab) {
			case Tab.Gallery: {
				sections = sections.concat([
					{ name: 'Gradients', children: DataUtil.coverGradients() },
					{ name: 'Solid colors', children: DataUtil.coverColors() },
				]);
				break;
			};

			case Tab.Library:
			case Tab.Unsplash: {
				if (this.items.length) {
					sections.push({ children: this.items });
				};
				break;
			};
		};

		return sections;
	};

	onDragOver (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(this.node);
		const zone = node.find('.dropzone');

		zone.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(this.node);
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
		const node = $(this.node);
		const zone = node.find('.dropzone');
		
		zone.removeClass('isDraggingOver');
		preventCommonDrop(true);
		this.setState({ loading: true });
		
		C.FileUpload('', file, I.FileType.Image, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (!message.error.code) {
				ObjectUtil.setCover(rootId, I.CoverType.Upload, message.hash);
			};
		
			close();
		});
	};

});

export default MenuBlockCover;