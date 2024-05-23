import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { I, C, UtilData, analytics, UtilCommon, translate, UtilObject, keyboard, Action, UtilMenu } from 'Lib';
import { Cover, Filter, Icon, Label, EmptySearch, Loader } from 'Component';
import { detailStore, commonStore } from 'Store';
const Constant = require('json/constant.json');

enum Tab {
	Gallery	 = 0,
	Unsplash = 1,
	Library	 = 2,
	Upload	 = 3,
};

interface State {
	filter: string;
	isLoading: boolean;
};

const LIMIT = 36;

const MenuBlockCover = observer(class MenuBlockCover extends React.Component<I.Menu, State> {

	_isMounted = false;
	node: any = null;
	state = {
		filter: '',
		isLoading: false,
	};
	items: any[] = [];
	filter = '';
	refFilter: any = null;
	timeout = 0;
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
		const { filter, isLoading } = this.state;
		const tabs: any[] = [
			{ id: Tab.Gallery, name: translate('menuBlockCoverGallery') },
			{ id: Tab.Unsplash, name: translate('menuBlockCoverUnsplash') },
			{ id: Tab.Library, name: translate('menuBlockCoverLibrary') },
			{ id: Tab.Upload, name: translate('menuBlockCoverUpload') },
		].filter(it => it);
		const sections = this.getSections();

		const Item = (item: any) => (
			<div className="item" onClick={e => this.onSelect(e, item)}>
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
					ref={ref => this.refFilter = ref}
					className="outlined"
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
						) : <EmptySearch text={filter ? UtilCommon.sprintf(translate('menuBlockCoverEmptyFilter'), filter) : translate('menuBlockCoverEmpty')} />}
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
						<Label text={translate('menuBlockCoverChoose')} />
					</div>
				);
				break;
			};
		};

		if (isLoading) {
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
							onClick={() => this.setTab(item.id)}
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
		this.rebind();

		keyboard.disablePaste(true);
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
		this.unbind();

		keyboard.disablePaste(false);
	};

	unbind () {
		$(window).off('paste.menuBlockCover');
	};

	rebind () {
		this.unbind();
		$(window).on('paste.menuBlockCover', e => this.onPaste(e));
	};

	load () {
		const { filter } = this.state;

		this.items = [];

		if (![ Tab.Unsplash, Tab.Library ].includes(this.tab)) {
			this.setState({ isLoading: false });
			return;
		};

		switch (this.tab) {
			case Tab.Unsplash: {
				this.setState({ isLoading: true });

				C.UnsplashSearch(filter, LIMIT, (message: any) => {
					if (message.error.code) {
						this.setState({ isLoading: false });
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

					this.setState({ isLoading: false });
				});
				break;
			};

			case Tab.Library: {
				const filters: I.Filter[] = [
					{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Image },
					{ operator: I.FilterOperator.And, relationKey: 'widthInPixels', condition: I.FilterCondition.GreaterOrEqual, value: 1000 },
					{ operator: I.FilterOperator.And, relationKey: 'heightInPixels', condition: I.FilterCondition.GreaterOrEqual, value: 300 },
				];
				const sorts = [ 
					{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
				];

				this.setState({ isLoading: true });

				UtilData.search({
					filters,
					sorts,
					fullText: filter,
					limit: 1000,
				}, (message: any) => {
					this.setState({ isLoading: false });

					if (message.error.code) {
						this.setState({ isLoading: false });
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

					this.forceUpdate();
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
		const { param, close } = this.props;
		const { data } = param;
		const { onUpload, onUploadStart } = data;

		Action.openFile(Constant.fileExtension.cover, paths => {
			close();

			if (onUploadStart) {
				onUploadStart();
			};

			C.FileUpload(commonStore.space, '', paths[0], I.FileType.Image, {}, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (onUpload) {
					onUpload(I.CoverType.Upload, message.objectId);
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

			C.UnsplashDownload(commonStore.space, item.id, (message: any) => {
				if (!message.error.code) {
					onUpload(item.type, message.objectId);
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
		this.timeout = window.setTimeout(() => this.setState({ filter: v }), Constant.delay.keyboard);
	};

	getSections () {
		let sections: any[] = [];
		switch (this.tab) {
			case Tab.Gallery: {
				sections = sections.concat([
					{ name: translate('menuBlockCoverGradients'), children: UtilMenu.getCoverGradients() },
					{ name: translate('menuBlockCoverSolidColors'), children: UtilMenu.getCoverColors() },
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
		this.setState({ isLoading: true });
		
		C.FileUpload(commonStore.space, '', file, I.FileType.Image, {}, (message: any) => {
			this.setState({ isLoading: false });
			preventCommonDrop(false);
			
			if (!message.error.code) {
				UtilObject.setCover(rootId, I.CoverType.Upload, message.obejctId);
			};
		
			close();
		});
	};

	onPaste (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;
		const files = UtilCommon.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items);

		if (!files.length) {
			return;
		};

		this.setState({ isLoading: true });

		UtilCommon.saveClipboardFiles(files, {}, (data: any) => {
			if (!data.files.length) {
				this.setState({ isLoading: false });
				return;
			};

			C.FileUpload(commonStore.space, '', data.files[0].path, I.FileType.Image, {}, (message: any) => {
				if (!message.error.code) {
					UtilObject.setCover(rootId, I.CoverType.Upload, message.objectId);
				};

				this.setState({ isLoading: false });
				close();
			});
		});
	};

});

export default MenuBlockCover;
