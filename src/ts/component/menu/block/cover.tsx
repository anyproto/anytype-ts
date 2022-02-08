import * as React from 'react';
import { I, C, DataUtil, translate, analytics } from 'ts/lib';
import { Cover, Filter } from 'ts/component';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

enum Tab {
	Gallery	 = 0,
	Unsplash = 1,
	Upload	 = 2,
};

interface State {
	filter: string;
	tab: Tab;
};

const { dialog } = window.require('@electron/remote');
const Constant = require('json/constant.json');

const MenuBlockCover = observer(class MenuBlockCover extends React.Component<Props, State> {

	state = {
		filter: '',
		tab: Tab.Gallery,
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
	};

	render () {
		const { filter, tab } = this.state;
		const tabs: any[] = [
			{ id: Tab.Gallery, name: 'Gallery' },
			{ id: Tab.Unsplash, name: 'Unsplash' },
			{ id: Tab.Upload, name: 'Upload' },
		];

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
				content = (
					<React.Fragment>
						<Filter 
							ref={(ref: any) => { this.refFilter = ref; }}
							value={filter}
							onChange={this.onFilterChange} 
						/>

						<div className="sections">
							<div className="section unsplash">
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
				break;
		};

		return (
			<div className="wrap">
				<div className="head">
					{tabs.map((item: any, i: number) => (
						<div 
							key={item.id} 
							className={[ 'btn', (item.id == tab ? 'active' : '') ].join(' ')}
							onClick={() => { this.setState({ tab: item.id }); }}
						>
							{item.name}
						</div>
					))}
				</div>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this.load();
	};

	componentDidUpdate () {
		const { filter } = this.state;
		
		if (this.filter != filter) {
			this.filter = filter;
			this.load();
		};
	};

	load () {
		const { filter } = this.state;

		this.items = [];
		C.UnsplashSearch(filter, 24, (message: any) => {
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

			C.UploadFile('', files[0], I.FileType.Image, (message: any) => {
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
			{ name: 'Solid colors', children: DataUtil.coverColors() },
			{ name: 'Gradients', children: DataUtil.coverGradients() },
		];
	};
});

export default MenuBlockCover;