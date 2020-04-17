import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, C, focus } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

const { dialog } = window.require('electron').remote;

@observer
class Controls extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onAddIcon = this.onAddIcon.bind(this);
		this.onAddCover = this.onAddCover.bind(this);
	};

	render (): any {
		return (
			<div className="controls">
				<div className="sides">
					<div className="side left">
						<div id="button-add-icon" className="btn addIcon" onClick={this.onAddIcon}>
							<Icon />
							<div className="txt">Add icon</div>
						</div>
					</div>
					
					<div className="side right">
						<div id="button-add-cover" className="btn addCover" onClick={this.onAddCover}>
							<Icon />
							<div className="txt">Add cover image</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	onAddIcon (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		if (!root) {
			return;
		};
		
		focus.clear(true);
		
		if (root.isPageProfile()) {
			this.onAddIconUser();
		} else {
			this.onAddIconPage();
		};
	};
	
	onAddIconPage () {
		const { rootId } = this.props;
		
		commonStore.menuOpen('smile', { 
			element: '#button-add-icon',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				onSelect: (icon: string) => {
					C.BlockSetDetails(rootId, [ 
						{ key: 'icon', value: icon } 
					]);
				}
			}
		});
	};
	
	onAddIconUser () {
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
			
			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				C.BlockSetDetails(rootId, [ 
					{ key: 'icon', value: message.hash },
				]);
			});
		});
	};
	
	onAddCover (e: any) {
		const { rootId } = this.props;
		
		focus.clear(true);
		
		commonStore.menuOpen('blockCover', { 
			element: '#button-add-cover',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				onSelect: (type: I.CoverType, id: string) => {
					C.BlockSetDetails(rootId, [ 
						{ key: 'coverType', value: type },
						{ key: 'coverId', value: id },
					]);
				}
			}
		});
	};
	
};

export default Controls;