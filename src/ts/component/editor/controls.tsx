import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { ControlButtons } from 'ts/component';
import { I, C, focus, DataUtil, Util, translate, analytics } from 'ts/lib';
import { menuStore, blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	dataset?: any;
	resize?: () => void;
};

const { dialog } = window.require('@electron/remote');
const Constant = require('json/constant.json');
const $ = require('jquery');

const Controls = observer(class Controls extends React.Component<Props, {}> {
	
	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onIcon = this.onIcon.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLayout = this.onLayout.bind(this);
		this.onRelation = this.onRelation.bind(this);
		
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
	};

	render (): any {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys);
		if ((object.coverType != I.CoverType.None) && object.coverId) {
			return null;
		};

		return (
			<div 
				className="editorControls editorControlElements"
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				<ControlButtons 
					rootId={rootId} 
					onIcon={this.onIcon} 
					onCover={this.onCover}
					onLayout={this.onLayout}
					onRelation={this.onRelation}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentDidUpdate () {
		this.props.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	onIcon (e: any) {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		
		focus.clear(true);
		root.isObjectHuman() ? this.onIconUser() : this.onIconPage();
	};
	
	onIconPage () {
		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		
		menuStore.open('smile', { 
			element: '.editorControls #button-icon',
			onOpen: () => {
				node.addClass('hover');
			},
			onClose: () => {
				node.removeClass('hover');
			},
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
	
	onIconUser () {
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
			
			C.UploadFile('', files[0], I.FileType.Image, (message: any) => {
				if (message.error.code) {
					return;
				};
				
				DataUtil.pageSetIcon(rootId, '', message.hash);
			});
		});
	};
	
	onCover (e: any) {
		const { rootId } = this.props;
		const colors = DataUtil.coverColors();
		const color = colors[Util.rand(0, colors.length - 1)];

		focus.clear(true);
		DataUtil.pageSetCover(rootId, I.CoverType.Color, color.id, 0, 0, 0);

		analytics.event('SetCover', { type: I.CoverType.Color, id: color.id });
	};

	onLayout (e: any) {
		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const object = detailStore.get(rootId, rootId, []);
		
		menuStore.open('blockLayout', { 
			element: '.editorControls #button-layout',
			onOpen: () => {
				node.addClass('hover');
			},
			onClose: () => {
				node.removeClass('hover');
			},
			subIds: Constant.menuIds.layout,
			data: {
				rootId: rootId,
				value: object.layout,
			}
		});
	};

	onRelation (e: any) {
		const { isPopup, rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const container = $(isPopup ? '#popupPage #innerWrap' : window);
		const st = container.scrollTop();
		const rect = { x: container.width() / 2 , y: Util.sizeHeader() + st, width: 1, height: 1 };
		const cnw = [ 'fixed' ];

		if (isPopup) {
			const offset = container.offset();
			rect.x += offset.left;
			rect.y += offset.top;
		} else {
			cnw.push('fromHeader');
		};

		const param: any = {
			rect: rect,
			horizontal: I.MenuDirection.Left,
			noFlipX: true,
			noFlipY: true,
			subIds: Constant.menuIds.cell,
			classNameWrap: cnw.join(' '),
			onOpen: () => {
				node.addClass('hover');
			},
			onClose: () => {
				node.removeClass('hover');
				menuStore.closeAll();
			},
			data: {
				isPopup: isPopup,
				rootId: rootId,
			},
		};

		menuStore.closeAll(null, () => { menuStore.open('blockRelationView', param); });
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
		
		C.UploadFile('', file, I.FileType.Image, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (message.error.code) {
				return;
			};
			
			DataUtil.pageSetCover(rootId, I.CoverType.Upload, message.hash);
		});
	};

});

export default Controls;