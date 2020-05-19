import * as React from 'react';
import { IconUser } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
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
	};

	render (): any {
		const { rootId } = this.props;
		const details = blockStore.getDetails(rootId, rootId);
		const { name, iconImage } = details;
		
		return (
			<React.Fragment>
				<IconUser name={name} icon={iconImage ? commonStore.imageUrl(iconImage, Constant.size.iconPage) : ''} onClick={this.onClick} className="c96" />
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
					{ id: 'upload', name: 'Change' },
					{ id: 'remove', name: 'Remove' },
				],
				onSelect: (event: any, item: any) => {
					if (item.id == 'remove') {
						DataUtil.pageSetIcon(rootId, '', '');
					};
					if (item.id == 'upload') {
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
			filters: [ { name: '', extensions: Constant.extension.image } ]
		};
		
		dialog.showOpenDialog(options).then((result: any) => {
			const files = result.filePaths;
			if ((files == undefined) || !files.length) {
				return;
			};
			
			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				DataUtil.pageSetIcon(rootId, '', message.hash);
			});
		});
	};
	
};

export default BlockIconUser;