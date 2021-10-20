import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, C, focus, DataUtil, Util, translate } from 'ts/lib';
import { commonStore, menuStore, blockStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	dataset?: any;
}

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
		const allowedDetails = blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Details ]);
		const checkType = blockStore.checkBlockType(rootId);

		if (!root || !allowedDetails || checkType) {
			return null;
		};

		const allowedLayout = !root.isObjectSet() && blockStore.isAllowed(rootId, rootId, [ I.RestrictionObject.Layout ]);
		const allowedRelation = true;
		const allowIcon = !root.isObjectTask() && !root.isObjectNote();
		const allowCover = !root.isObjectNote();

		return (
			<div 
				className="editorControls"
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				<div className="controlButtons">
					{allowIcon ? (
						<div id="button-icon" className="btn" onClick={this.onIcon}>
							<Icon className="icon" />
							<div className="txt">{translate('editorControlIcon')}</div>
						</div>
					) : ''}

					{allowCover ? (
						<div id="button-cover" className="btn" onClick={this.onCover}>
							<Icon className="addCover" />
							<div className="txt">{translate('editorControlCover')}</div>
						</div>
					) : ''}

					{allowedLayout ? (
						<div id="button-layout" className="btn" onClick={this.onLayout}>
							<Icon className="layout" />
							<div className="txt">{translate('editorControlLayout')}</div>
						</div>
					) : ''}

					{allowedRelation ? (
						<div id="button-relation" className="btn" onClick={this.onRelation}>
							<Icon className="relation" />
							<div className="txt">{translate('editorControlRelation')}</div>
						</div>
					) : ''}
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
			
			C.UploadFile('', files[0], I.FileType.Image, true, (message: any) => {
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
				onChange: (layout: I.ObjectLayout) => {
					DataUtil.pageSetLayout(rootId, layout);
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

		if (isPopup) {
			const offset = container.offset();
			rect.x += offset.left;
			rect.y += offset.top;
		};

		const param: any = {
			rect: rect,
			horizontal: I.MenuDirection.Left,
			noFlipX: true,
			noFlipY: true,
			subIds: Constant.menuIds.cell,
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

		if (!isPopup) {
			param.classNameWrap = 'fromHeader';
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
		
		C.UploadFile('', file, I.FileType.Image, true, (message: any) => {
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