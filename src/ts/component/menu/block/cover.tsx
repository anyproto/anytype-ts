import * as React from 'react';
import { I, C, DataUtil, Util, translate } from 'ts/lib';
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
		const canEdit = coverType && [ I.CoverType.Upload, I.CoverType.Image ].indexOf(coverType) >= 0;

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
			url: Util.sprintf(Url.unsplash, 24),
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

			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (onUpload) {
					onUpload(message.hash);
				};
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
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		DataUtil.pageSetCover(rootId, I.CoverType.None, '');
		this.props.close();
	};

	onSelect (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, onSelect, onUpload, onUploadStart } = data;
		const object = detailStore.get(rootId, rootId, [ 'coverId' ], true);

		if (!object.coverId) {
			this.props.close();
		};

		if (item.type == I.CoverType.Source) {
			if (onUploadStart) {
				onUploadStart();
			};

			console.log(item);

			/*
			C.UploadFile(item.full, '', I.FileType.Image, true, (message: any) => {
				if (message.error.code) {
					return;
				};

				if (onUpload) {
					onUpload(message.hash);
				};
			});
			*/
		} else
		if (onSelect) {
			onSelect(item);
		};
	};

	getSections () {
		const param: any = {
			/*
			'the-crystal-pallace':	 { coverY: -0.4044042597182052 },
			'the-little-pond':		 { coverY: -0.454407830247917 },
			'walk-at-pourville':	 { coverY: -0.25770020533880905 },
			'poppy-field':			 { coverY: -0.4174493937695995 },
			'ballet':				 { coverY: -0.07978591433444132 },
			'flower-girl':			 { coverY: -0.04454641887930348 },
			'fruits-midi':			 { coverY: -0.3303986352673582 },
			'autumn':				 { coverY: -0.3643453090265399 },
			'big-electric-chair':	 { coverY: -0.1711567107138921 },
			'flowers':				 { coverY: -0.5147540983606558 },
			'sunday-morning':		 { coverY: -0.19150779896013864, coverX: -0.09126984126984126, coverScale: 0.125 },
			'japan':				 { coverY: -0.15899595968950916 },
			'grass':				 { coverY: -0.5754087049822059 },
			'butter':				 { coverY: -0.07053696481594314 },
			'medication':			 { coverY: -0.4984825493171472 },
			'landscape3':			 { coverY: -0.20313036324937497 },
			'third-sleep':			 { coverY: -0.5534286421213346 },
			'banquet':				 { coverY: -0.3338497329693846 },
			'chemist':				 { coverY: -0.4084223252065283 },
			*/
		};

		let sections: any[] = [
			{ name: 'Solid colors', children: DataUtil.coverColors() },

			/*
			{ name: 'Art Institute of Chicago – Impressionism', children: [
				{ type: I.CoverType.Image, id: 'the-crystal-pallace', name: 'Camille Pissarro - The Crystal Palace' },
				{ type: I.CoverType.Image, id: 'the-little-pond', name: 'Childe Hassam - The Little Pond' },
				{ type: I.CoverType.Image, id: 'walk-at-pourville', name: 'Claude Monet Cliff Walk at Pourville' },
				{ type: I.CoverType.Image, id: 'poppy-field', name: 'Claude Monet Poppy Field' },
				{ type: I.CoverType.Image, id: 'ballet', name: 'Edgar Degas Ballet at the Paris Opéra' },
				{ type: I.CoverType.Image, id: 'flower-girl', name: 'George Hitchcock Flower Girl in Holland' },
				{ type: I.CoverType.Image, id: 'fruits-midi', name: 'Pierre-Auguste Renoir Fruits of the Midi' },
				{ type: I.CoverType.Image, id: 'autumn', name: 'Wilson H. Irvine Autumn' },
			] as any[] },

			{ name: 'Art Institute of Chicago – Pop Art', children: [
				{ type: I.CoverType.Image, id: 'big-electric-chair', name: 'Andy Warhol Big Electric Chair' },
				{ type: I.CoverType.Image, id: 'flowers', name: 'Andy Warhol Flowers' },
				{ type: I.CoverType.Image, id: 'sunday-morning', name: 'David Hockney Sunday Morning' },
				{ type: I.CoverType.Image, id: 'japan', name: 'David Hockney Inland Sea, Japan' },
				{ type: I.CoverType.Image, id: 'grass', name: 'James Rosenquist Spaghetti and Grass' },
				{ type: I.CoverType.Image, id: 'butter', name: 'James Rosenquist Whipped Butter for Eugene Ruchin' },
				{ type: I.CoverType.Image, id: 'medication', name: 'Roy Lichtenstein Artist’s Studio "Foot Medication"' },
				{ type: I.CoverType.Image, id: 'landscape3', name: 'Roy Lichtenstein Landscape 3' },
			] as any[] },

			{ name: 'Art Institute of Chicago – Surrealism', children: [
				{ type: I.CoverType.Image, id: 'third-sleep', name: 'Kay Sage In the Third Sleep' },
				{ type: I.CoverType.Image, id: 'banquet', name: 'René Magritte The Banquet' },
				{ type: I.CoverType.Image, id: 'chemist', name: 'Salvador Dalí A Chemist Lifting with Extreme Precaution the Cuticle of a Grand Piano' },
			] as any[] },
			*/

			{ name: 'Gradients', children: [
				{ type: I.CoverType.Gradient, id: 'yellow' },
				{ type: I.CoverType.Gradient, id: 'red' },
				{ type: I.CoverType.Gradient, id: 'blue' },
				{ type: I.CoverType.Gradient, id: 'teal' },
			] as any[] },

			{ name: 'Unsplash', children: this.items },
		];

		sections = sections.map((s: any) => {
			s.children = s.children.map((c: any) => {
				return param[c.id] ? Object.assign(c, param[c.id]) : c;
			});
			return s;
		});

		return sections;
	};
});

export default MenuBlockCover;