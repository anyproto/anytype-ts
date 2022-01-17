import * as React from 'react';
import { I, C, DataUtil, Util, translate, analytics } from 'ts/lib';
import { Cover } from 'ts/component';
import { detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');
const { dialog } = window.require('@electron/remote');
const Constant = require('json/constant.json');
const Url = require('json/url.json');

const MenuBlockCover = observer(class MenuBlockCover extends React.Component<Props, {}> {

	items: any[] = [];

	constructor (props: any) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onRemove = this.onRemove.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
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
			<div>
				<div className="head">
					<div className="btn" onClick={this.onUpload}>{translate('menuBlockCoverUpload')}</div>
					{canEdit ? (
						<div className="btn" onClick={this.onEdit}>{translate('menuBlockCoverEdit')}</div>
					) : ''}
					<div className="btn" onClick={this.onRemove}>{translate('menuBlockCoverRemove')}</div>
				</div>
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

	load () {
		$.ajax({
			url: Util.sprintf(Url.unsplash.api, 24),
			headers: {
				'Authorization': 'Client-ID ' + Constant.unsplash,
			},
			type: 'GET',
			contentType: 'application/json',
			success: (data: any) => {
				for (let item of data) {
					this.items.push({
						id: item.id,
						type: I.CoverType.Source,
						src: item.urls.thumb,
						full: item.urls.full,
						download: item.links.download,
						user: item.user,
					});
				};

				this.forceUpdate();
			}
		});
	};

	onUpload (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, onUpload, onUploadStart } = data;
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
				if (message.error.code) {
					return;
				};

				onUpload(item.type, message.image.hash);
			});

			close();
		} else
		if (onSelect) {
			onSelect(item);
		};

		analytics.event('SetCover', { type: item.type, id: item.id });
	};

	getSections () {
		let sections: any[] = [
			{ name: 'Solid colors', children: DataUtil.coverColors() },
			{ name: 'Gradients', children: [
				{ type: I.CoverType.Gradient, id: 'yellow' },
				{ type: I.CoverType.Gradient, id: 'red' },
				{ type: I.CoverType.Gradient, id: 'blue' },
				{ type: I.CoverType.Gradient, id: 'teal' },
				{ type: I.CoverType.Gradient, id: 'pinkOrange' },
				{ type: I.CoverType.Gradient, id: 'bluePink' },
				{ type: I.CoverType.Gradient, id: 'greenOrange' },
				{ type: I.CoverType.Gradient, id: 'sky' },
			] as any[] },

			{ name: 'Unsplash', children: this.items },
		];
		return sections;
	};
});

export default MenuBlockCover;