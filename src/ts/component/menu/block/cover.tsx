import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util } from 'ts/lib';
import { Cover } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const { dialog } = window.require('electron').remote;
const Constant = require('json/constant.json');

@observer
class MenuBlockCover extends React.Component<Props, {}> {
	
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
		const details = blockStore.getDetails(rootId, rootId);
		const { coverType } = details;
		const canEdit = coverType && [ I.CoverType.Image, I.CoverType.BgImage ].indexOf(coverType) >= 0;
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((item: any, i: number) => {
						return <Cover key={i} {...item} image={item.value} className={item.value} onClick={(e: any) => { this.onSelect(e, item); }} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				<div className="head">
					<div className="btn" onClick={this.onUpload}>Upload image</div>
					{canEdit ? (
						<div className="btn" onClick={this.onEdit}>Reposition</div>
					) : ''}
					<div className="btn" onClick={this.onRemove}>Remove</div>
				</div>
				<div className="sections">
					{sections.map((section: any, i: number) => {
						return <Section key={i} {...section} />;
					})}
				</div>
			</div>
		);
	};
	
	onUpload (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, onUpload, onUploadStart } = data;
		const options: any = { 
			properties: [ 'openFile' ], 
			filters: [ { name: '', extensions: Constant.extension.image } ]
		};
		
		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};
			
			commonStore.menuClose(this.props.id);
			
			if (onUploadStart) {
				onUploadStart();
			};

			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				DataUtil.pageSetCover(rootId, I.CoverType.Image, message.hash);
				
				if (onUpload) {
					onUpload();
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
		commonStore.menuClose(this.props.id);
	};
	
	onRemove (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		
		DataUtil.pageSetCover(rootId, I.CoverType.None, '');
		commonStore.menuClose(this.props.id);
	};
	
	onSelect (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, onSelect } = data;
		const details = blockStore.getDetails(rootId, rootId);
		
		if (!details.coverId) {
			commonStore.menuClose(this.props.id);
		};
		
		if (onSelect) {
			onSelect(item.type, item.value);
		};
	};
	
	getSections () {
		return [
			{ name: 'Solid colors', children: [
				{ type: I.CoverType.Color, value: 'yellow' },
				{ type: I.CoverType.Color, value: 'orange' },
				{ type: I.CoverType.Color, value: 'red' },
				{ type: I.CoverType.Color, value: 'pink' },
				{ type: I.CoverType.Color, value: 'purple' },
				{ type: I.CoverType.Color, value: 'blue' },
				{ type: I.CoverType.Color, value: 'ice' },
				{ type: I.CoverType.Color, value: 'teal' },
				{ type: I.CoverType.Color, value: 'green' },
				{ type: I.CoverType.Color, value: 'lightgrey' },
				{ type: I.CoverType.Color, value: 'darkgrey' },
				{ type: I.CoverType.Color, value: 'black' },
			] as any[] },
			
			{ name: 'Gradients', children: [
				{ type: I.CoverType.Gradient, value: 'yellow' },
				{ type: I.CoverType.Gradient, value: 'red' },
				{ type: I.CoverType.Gradient, value: 'blue' },
				{ type: I.CoverType.Gradient, value: 'teal' },
			] as any[] },

			{ name: 'Art Institute of Chicago – Impressionism', children: [
				{ type: I.CoverType.BgImage, value: 'the-crystal-pallace', name: 'Camille Pissarro - The Crystal Palace' },
				{ type: I.CoverType.BgImage, value: 'the-little-pond', name: 'Childe Hassam - The Little Pond' },
				{ type: I.CoverType.BgImage, value: 'walk-at-pourville', name: 'Claude Monet Cliff Walk at Pourville' },
				{ type: I.CoverType.BgImage, value: 'poppy-field', name: 'Claude Monet Poppy Field' },
				{ type: I.CoverType.BgImage, value: 'ballet', name: 'Edgar Degas Ballet at the Paris Opéra' },
				{ type: I.CoverType.BgImage, value: 'flower-girl', name: 'George Hitchcock Flower Girl in Holland' },
				{ type: I.CoverType.BgImage, value: 'fruits-midi', name: 'Pierre-Auguste Renoir Fruits of the Midi' },
				{ type: I.CoverType.BgImage, value: 'autumn', name: 'Wilson H. Irvine Autumn' },
			] as any[] },

			{ name: 'Art Institute of Chicago – Pop Art', children: [
				{ type: I.CoverType.BgImage, value: 'big-electric-chair', name: 'Andy Warhol Big Electric Chair' },
				{ type: I.CoverType.BgImage, value: 'flowers', name: 'Andy Warhol Flowers' },
				{ type: I.CoverType.BgImage, value: 'sunday-morning', name: 'David Hockney Sunday Morning' },
				{ type: I.CoverType.BgImage, value: 'japan', name: 'David Hockney Inland Sea, Japan' },
				{ type: I.CoverType.BgImage, value: 'grass', name: 'James Rosenquist Spaghetti and Grass' },
				{ type: I.CoverType.BgImage, value: 'butter', name: 'James Rosenquist Whipped Butter for Eugene Ruchin' },
				{ type: I.CoverType.BgImage, value: 'medication', name: 'Roy Lichtenstein Artist’s Studio "Foot Medication"' },
				{ type: I.CoverType.BgImage, value: 'landscape3', name: 'Roy Lichtenstein Landscape 3' },
			] as any[] },

			{ name: 'Art Institute of Chicago – Surrealism', children: [
				{ type: I.CoverType.BgImage, value: 'third-sleep', name: 'Kay Sage In the Third Sleep' },
				{ type: I.CoverType.BgImage, value: 'banquet', name: 'René Magritte The Banquet' },
				{ type: I.CoverType.BgImage, value: 'chemist', name: 'Salvador Dalí A Chemist Lifting with Extreme Precaution the Cuticle of a Grand Piano' },
			] as any[] }
		];
	};
	
};

export default MenuBlockCover;