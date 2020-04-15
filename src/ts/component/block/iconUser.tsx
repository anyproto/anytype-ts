import * as React from 'react';
import { Smile, IconUser } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	block: I.Block;
};

const Constant = require('json/constant.json');
const { dialog } = window.require('electron').remote;

@observer
class BlockIconUser extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onSelect = this.onSelect.bind(this);
	};

	render (): any {
		const { rootId } = this.props;
		const details = blockStore.getDetail(rootId, rootId);
		const { name, icon } = details;
		
		return (
			<React.Fragment>
				<IconUser name={name} icon={icon ? commonStore.imageUrl(icon, 256) : ''} onClick={this.onClick} className="c96" />
			</React.Fragment>
		);
	};
	
	onClick (e: any) {
		const { rootId } = this.props;
		
		commonStore.menuOpen('select', { 
			element: '#block-' + rootId + '-icon',
			type: I.MenuType.Vertical,
			offsetX: Constant.size.blockMenu,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				value: '',
				options: [
					{ id: 'upload', name: 'Upload' },
					{ id: 'remove', name: 'Remove' },
				],
				onSelect: (event: any, id: string) => {
					if (id == 'remove') {
						C.BlockSetDetails(rootId, [ { key: 'icon', value: '' } ]);
					};
					if (id == 'upload') {
						this.onUpload();
					};
				},
			}
		});
	};
	
	onUpload () {
		const { rootId } = this.props;
		
		const options: any = { 
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
					{ key: 'icon', value: message.hash },
				]);
			});
		});
	};
	
	onSelect (icon: string) {
		const { rootId } = this.props;
		
		C.BlockSetDetails(rootId, [ { key: 'icon', value: icon } ]);
	};
	
};

export default BlockIconUser;