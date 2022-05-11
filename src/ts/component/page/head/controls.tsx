import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Loader } from 'ts/component';
import { I, C, focus, DataUtil, Util } from 'ts/lib';
import { menuStore, blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

import ControlButtons  from './controlButtons';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	readonly?: boolean;
	dataset?: any;
	resize?: () => void;
	focusTitle?: () => void;
};

interface State {
	loading: boolean;
};

const { dialog } = window.require('@electron/remote');
const Constant = require('json/constant.json');
const $ = require('jquery');

const Controls = observer(class Controls extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		loading: false,
	};

	constructor (props: any) {
		super(props);
		
		this.onIcon = this.onIcon.bind(this);
		this.onCoverOpen = this.onCoverOpen.bind(this);
		this.onCoverClose = this.onCoverClose.bind(this);
		this.onLayout = this.onLayout.bind(this);
		this.onRelation = this.onRelation.bind(this);
		
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onUploadStart = this.onUploadStart.bind(this);
		this.onUpload = this.onUpload.bind(this);
	};

	render (): any {
		const { rootId, readonly } = this.props;
		const { loading } = this.state;
		const object = detailStore.get(rootId, rootId, Constant.coverRelationKeys);
		const cn = [ 'editorControls', 'editorControlElements' ];
		
		if ((object.coverType != I.CoverType.None) && object.coverId) {
			return null;
		};

		if (loading) {
			cn.push('active');
		};

		return (
			<div 
				className={cn.join(' ')}
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				{loading ? <Loader /> : ''}
				<ControlButtons 
					rootId={rootId} 
					readonly={readonly}
					onIcon={this.onIcon} 
					onCoverOpen={this.onCoverOpen}
					onCoverClose={this.onCoverClose}
					onLayout={this.onLayout}
					onRelation={this.onRelation}
					onEdit={() => {}}
					onUploadStart={this.onUploadStart}
					onUpload={this.onUpload}
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
	
	onCoverOpen () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.addClass('hover');
	};

	onCoverClose () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.removeClass('hover');
	};

	onLayout (e: any) {
		const { rootId, focusTitle } = this.props;
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
				onLayoutSelect: (id: I.ObjectLayout) => {
					focusTitle();
				},
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
		this.onUploadStart();
		
		C.UploadFile('', file, I.FileType.Image, (message: any) => {
			this.setState({ loading: false });
			preventCommonDrop(false);
			
			if (!message.error.code) {
				this.onUpload(I.CoverType.Upload, message.hash);
			};
		});
	};

	onUploadStart () {
		this.setState({ loading: true });
	};
	
	onUpload (type: I.CoverType, hash: string) {
		const { rootId } = this.props;

		DataUtil.pageSetCover(rootId, type, hash, 0, -0.25, 0, () => {
			this.setState({ loading: false });
		});
	};


});

export default Controls;