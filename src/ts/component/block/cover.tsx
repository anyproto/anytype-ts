import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, Drag } from 'ts/component';
import { I, C, Util, DataUtil } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Block, RouteComponentProps<any> {
	rootId: string;
};

interface State {
	isEditing: boolean;
};

const $ = require('jquery');

@observer
class BlockCover extends React.Component<Props, State> {
	
	state = {
		isEditing: false,
	};
	
	constructor (props: any) {
		super(props);
		
		this.onEdit = this.onEdit.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render() {
		const { isEditing } = this.state;
		
		let elements = null;
		
		if (isEditing) {
			elements = (
				<React.Fragment>
					<div key="btn-drag" className="btn black drag">
						<Icon />
						<div className="txt">Drag image to reposition</div>
					</div>
					
					<div className="dragWrap">
						<Drag onMove={(v: number) => { this.onDragMove(v); }} onEnd={(v: number) => { this.onDragEnd(v); }} />
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
						<div className="btn white addCover" onClick={this.onEdit}>
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
				<div className="elements">
					{elements}
				</div>
			</div>
		);
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
	
	onDragMove (v: number) {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#drag-value');
		const cover = node.find('#cover');
		
		v = Math.ceil((v + 1) * 100);
		
		value.text(v + '%');
		cover.css({ backgroundSize: v + '% ' + v + '%' });
	};
	
	onDragEnd (v: number) {
	};
	
};

export default BlockCover;