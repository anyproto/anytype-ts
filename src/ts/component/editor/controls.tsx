import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, C, focus, DataUtil, Util, translate } from 'ts/lib';
import { menuStore, blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
	readOnly: boolean;
};

const { dialog } = window.require('electron').remote;
const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class Controls extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onAddIcon = this.onAddIcon.bind(this);
		this.onAddCover = this.onAddCover.bind(this);
		
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onOut = this.onOut.bind(this);
	};

	render (): any {
		const { rootId, readOnly } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (readOnly) {
			return null;
		};

		const object = detailStore.get(rootId, rootId, [ 'layoutAlign' ]);

		return (
			<div 
				className={[ 'editorControls', 'align' + object.layoutAlign ].join(' ')}
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
				onMouseOver={this.onOver}
				onMouseOut={this.onOut}
			>
				<div className="buttons">
					{!root.isObjectTask() ? (
						<div id="button-add-icon" className="btn addIcon" onClick={this.onAddIcon}>
							<Icon />
							<div className="txt">{translate('editorControlIcon')}</div>
						</div>
					) : ''}

					<div id="button-add-cover" className="btn addCover" onClick={this.onAddCover}>
						<Icon />
						<div className="txt">{translate('editorControlCover')}</div>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	onAddIcon (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		focus.clear(true);
		root.isObjectHuman() ? this.onAddIconUser() : this.onAddIconPage();
	};
	
	onAddIconPage () {
		const { rootId } = this.props;
		
		menuStore.open('smile', { 
			element: '#button-add-icon',
			offsetY: 4,
			data: {
				onSelect: (icon: string) => {
					DataUtil.pageSetIcon(rootId, icon, '');
				},
				onUpload (hash: string) {
					DataUtil.pageSetIcon(rootId, '', hash);
				},
			}
		});
	};
	
	onAddIconUser () {
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
	
	onAddCover (e: any) {
		const { rootId } = this.props;
		const colors = DataUtil.coverColors();
		const color = colors[Util.rand(0, colors.length - 1)];
		
		focus.clear(true);
		DataUtil.pageSetCover(rootId, I.CoverType.Color, color.id, 0, 0, 0);
	};
	
	onDragOver (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this._isMounted || !e.dataTransfer.files || !e.dataTransfer.files.length) {
			return;
		};
		
		const { rootId, dataset } = this.props;
		const { preventCommonDrop } = dataset || {};
		const file = e.dataTransfer.files[0].path;
		const node = $(ReactDOM.findDOMNode(this));
		
		node.removeClass('isDraggingOver');
		preventCommonDrop(true);
		this.setState({ loading: true });
		
		C.UploadFile('', file, I.FileType.Image, true, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (message.error.code) {
				return;
			};
			
			DataUtil.pageSetCover(rootId, I.CoverType.Upload, message.hash);
		});
	};

	onOver (e: any) {
		$('.headerMainEditSearch').addClass('active');
	};

	onOut (e: any) {
		$('.headerMainEditSearch').removeClass('active');
	};
	
};

export default Controls;