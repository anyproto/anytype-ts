import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Drag } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { trace } from 'mobx';

interface Props extends I.Block, RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

interface State {
	isEditing: boolean;
};

const $ = require('jquery');

@observer
class BlockCover extends React.Component<Props, State> {
	
	_isMounted = false;
	state = {
		isEditing: false,
	};
	rect: DOMRect = null;
	cover: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onMenu = this.onMenu.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
		
		this.onScaleStart = this.onScaleStart.bind(this);
		this.onScaleMove = this.onScaleMove.bind(this);
		this.onScaleEnd = this.onScaleEnd.bind(this);
		
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragMove = this.onDragMove.bind(this);
		this.onDragEnd = this.onDragEnd.bind(this);
	};
	
	render() {
		const { isEditing } = this.state;
		
		trace(true);
		console.log('COVER RENDER');
		console.trace();
		
		let elements = null;
		
		if (isEditing) {
			elements = (
				<React.Fragment>
					<div key="btn-drag" className="btn black drag" onMouseDown={this.onDragStart}>
						<Icon />
						<div className="txt">Drag image to reposition</div>
					</div>
					
					<div className="dragWrap">
						<Drag onStart={(v: number) => { this.onScaleStart(v); }} onMove={(v: number) => { this.onScaleMove(v); }} onEnd={(v: number) => { this.onScaleEnd(v); }} />
						<div id="drag-value" className="number">100%</div>
					</div>
					
					<div className="buttons">
						<div className="btn white" onClick={this.onSave}>Save changes</div>
						<div className="btn white" onClick={this.onCancel}>Cancel</div>
					</div>
				</React.Fragment>
			);
		} else {
			elements = (
				<React.Fragment>
					<div className="buttons">
						<div id="button-cover-edit" className={[ 'btn', 'white', 'addCover', (commonStore.menuIsOpen('blockCover') ? 'active' : '') ].join(' ')} onClick={this.onMenu}>
							<Icon />
							<div className="txt">Update cover image</div>
						</div>
					</div>
				</React.Fragment>
			);
		};
		
		return (
			<div className="wrap">
				<div id="cover" className="cover" />
				<div id="elements" className="elements">
					{elements}
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
	
	onMenu (e: any) {
		const { id } = this.props;
		
		commonStore.menuOpen('blockCover', {
			element: '#button-cover-edit',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 17,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: {
				onEdit: this.onEdit
			},
		});
	};
	
	onEdit (e: any) {
		this.setState({ isEditing: true });
	};
	
	onSave (e: any) {
		this.setState({ isEditing: false });
	};
	
	onCancel (e: any) {
		this.setState({ isEditing: false });
	};
	
	onDragStart (e: any) {
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const elements = node.find('#elements');
		
		this.rect = (elements.get(0) as Element).getBoundingClientRect() as DOMRect;
		this.cover = node.find('#cover');
		
		selection.setPreventSelect(true);
		node.addClass('isDragging')
		
		win.unbind('mousemove.cover mouseup.cover');
		win.on('mousemove.cover', (e: any) => { this.onDragMove(e); });
		win.on('mouseup.cover', (e: any) => { this.onDragEnd(e); });
	};
	
	onDragMove (e: any) {
		if (!this._isMounted || !this.rect) {
			return false;
		};
		
		const px = this.checkPercent((e.pageX - this.rect.x) / this.rect.width);
		const py = this.checkPercent((e.pageY - this.rect.y) / this.rect.height);
		
		this.cover.css({ backgroundPosition: (px * 100) + '% ' + (py * 100) + '%' });
	};
	
	onDragEnd (e: any) {
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset;
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		
		selection.setPreventSelect(false);
		
		win.unbind('mousemove.cover mouseup.cover');
		node.removeClass('isDragging')
	};
	
	onScaleStart (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset;
		
		selection.setPreventSelect(true);
	};
	
	onScaleMove (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#drag-value');
		const cover = node.find('#cover');
		
		v = Math.ceil((v + 1) * 100);
		
		value.text(v + '%');
		cover.css({ backgroundSize: v + '% auto' });
	};
	
	onScaleEnd (v: number) {
		if (!this._isMounted) {
			return false;
		};
		
		const { dataset } = this.props;
		const { selection } = dataset;
		
		selection.setPreventSelect(true);
	};
	
	checkPercent (p: number): number {
		return Math.min(1, Math.max(0, p));
	};
	
};

export default BlockCover;