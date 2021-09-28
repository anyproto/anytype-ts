import * as React from 'react';
import { IconObject } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { menuStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {}

const Constant = require('json/constant.json');
const { dialog } = window.require('@electron/remote');

const BlockIconUser = observer(class BlockIconUser extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render (): any {
		const { rootId, readonly } = this.props;
		
		return (
			<IconObject 
				getObject={() => { return detailStore.get(rootId, rootId, []); }} 
				className={readonly ? 'isReadonly' : ''}
				onClick={this.onClick} 
				size={128} 
			/>
		);
	};
	
	onClick (e: any) {
		const { rootId, readonly } = this.props;

		if (readonly) {
			return;
		};

		const object = detailStore.get(rootId, rootId, []);
		const options = [
			{ id: 'upload', name: 'Change' },
		];

		if (object.iconImage) {
			options.push({ id: 'remove', name: 'Remove' });
		};
		
		menuStore.open('select', { 
			element: `#block-${rootId}-icon .iconObject`,
			data: {
				value: '',
				options: options,
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
			filters: [ { name: '', extensions: Constant.extension.cover } ]
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
	
});

export default BlockIconUser;