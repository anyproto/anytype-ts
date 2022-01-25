import * as React from 'react';
import { I, C, DataUtil, translate, analytics } from 'ts/lib';
import { Cover, Filter } from 'ts/component';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	filter: string;
};

const { dialog } = window.require('@electron/remote');
const Constant = require('json/constant.json');

const MenuBlockCover = observer(class MenuBlockCover extends React.Component<Props, State> {

	state = {
		filter: '',
	};
	items: any[] = [];
	filter: string = '';
	refFilter: any = null;
	timeout: number = 0;

	constructor (props: any) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { filter } = this.state;
		const sections = this.getSections();
		const object = detailStore.get(rootId, rootId, [ 'coverType' ], true);
		const { coverType } = object;
		const canEdit = DataUtil.coverIsImage(coverType);

		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((item: any, i: number) => {
						item.image = item.id;
						return <Cover key={i} preview={true} {...item} onClick={(e: any) => { this.onSelect(e, item); }} />;
					})}
				</div>
			</div>
		);

		return (
			<div className="wrap">
				<div className="head">
					<div className="btn" onClick={this.onUpload}>{translate('menuBlockCoverUpload')}</div>
					{canEdit ? (
						<div className="btn" onClick={this.onEdit}>{translate('menuBlockCoverEdit')}</div>
					) : ''}
					<div className="btn" onClick={this.onRemove}>{translate('menuBlockCoverRemove')}</div>
				</div>

				<Filter 
					ref={(ref: any) => { this.refFilter = ref; }}
					value={filter}
					onChange={this.onFilterChange} 
				/>

				<div className="sections">
					{sections.map((section: any, i: number) => {
						return <Section key={i} {...section} />;
					})}
				</div>
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

		C.UnsplashSearch(filter, 24, (message: any) => {
			if (message.error.code) {
				return;
			};

			message.pictures.forEach((item: any) => {
				this.items.push({
					id: item.id,
					type: I.CoverType.Source,
					src: item.url,
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

	onEdit (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onEdit } = data;

		if (onEdit) {
			onEdit();
		};

		this.props.close();
	};

	onRemove (e: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { rootId } = data;

		DataUtil.pageSetCover(rootId, I.CoverType.None, '');
		close();

		analytics.event('RemoveCover');
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
		let { filter } = this.state;
		let sections: any[] = [
			{ name: 'Solid colors', children: DataUtil.coverColors() },
			{ name: 'Gradients', children: DataUtil.coverGradients() },
		];
		sections = DataUtil.menuSectionsFilter(sections, filter);
		sections.push({ name: 'Unsplash', children: this.items });

		return sections;
	};
});

export default MenuBlockCover;