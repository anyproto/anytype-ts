import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C } from 'ts/lib';
import { Cover } from 'ts/component';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const { dialog } = window.require('electron').remote;

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
		const details = blockStore.getDetail(rootId, rootId);
		
		const Section = (item: any) => (
			<div className="section">
				<div className="name">{item.name}</div>
				<div className="items">
					{item.children.map((action: any, i: number) => {
						return <Cover key={i} {...action} className={action.value} onClick={(e: any) => { this.onSelect(e, action); }} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				<div className="head">
					<div className="btn" onClick={this.onUpload}>Upload image</div>
					{details.coverType && (details.coverType == I.CoverType.Image) ? (
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
		const { rootId } = data;
		
		let options: any = { 
			properties: [ 'openFile' ], 
			filters: [
				{ 
					name: '', 
					extensions: [ 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp' ] 
				},
			],
		};
		
		dialog.showOpenDialog(null, options, (files: any) => {
			if ((files == undefined) || !files.length) {
				return;
			};

			C.UploadFile('', files[0], I.FileType.Image, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				C.BlockSetDetails(rootId, [ 
					{ key: 'coverType', value: I.CoverType.Image },
					{ key: 'coverId', value: message.hash },
				]);
				
				commonStore.menuClose(this.props.id);
			});
		});
	};
	
	onEdit (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { onEdit } = data;
	
		onEdit();
		commonStore.menuClose(this.props.id);
	};
	
	onRemove (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		
		C.BlockSetDetails(rootId, [ 
			{ key: 'coverType', value: 0 },
			{ key: 'coverId', value: '' },
		]);
		
		commonStore.menuClose(this.props.id);
	};
	
	onSelect (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, onSelect } = data;
		const details = blockStore.getDetail(rootId, rootId);
		
		if (!details.coverId) {
			commonStore.menuClose(this.props.id);
		};
		
		onSelect(item.type, item.value);
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
			] as any[] }
		];
	};
	
};

export default MenuBlockCover;