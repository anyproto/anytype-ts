import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, InputWithFile } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockBookmark {
	rootId: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class BlockBookmark extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.onChangeUrl = this.onChangeUrl.bind(this);
	};

	render () {
		const { id, rootId, content } = this.props;
		const { url, title, description, imageHash, faviconHash } = content;
		
		let element = null;
		if (url) {
			let style: any = {};
			if (imageHash) {
				style.backgroundImage = 'url("' + commonStore.imageUrl(imageHash, 500) + '")';
			};
			
			element = (
				<div className="inner resizable">
					<div className="side left">
						<div className="name">{title}</div>
						<div className="descr">{description}</div>
						<div className="link">
							{faviconHash ? <Icon className="fav" icon={commonStore.imageUrl(faviconHash, 16)} /> : ''}
							{url}
						</div>
					</div>
					<div className="side right">
						<div className="img" style={style} />
					</div>
				</div>
			);
		} else {
			element = (
				<InputWithFile icon="bookmark" textFile="Paste a link" withFile={false} onChangeUrl={this.onChangeUrl} />
			);
		};
		
		return (
			<React.Fragment>
				{element}
			</React.Fragment>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.bind();
	};
	
	componentDidUpdate () {
		this.resize();
		this.bind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	onChangeUrl (e: any, url: string) {
		const { id, rootId } = this.props;
		C.BlockBookmarkFetch(rootId, id, url);
	};
	
	bind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.unbind('resize').on('resize', (e: any) => { this.resize(); });
	};
	
	unbind () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.unbind('resize');
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};
			
		const node = $(ReactDOM.findDOMNode(this));
		const width = node.width();
		
		width <= Constant.size.editorPage / 2 ? node.addClass('vertical') : node.removeClass('vertical');
	};
	
};

export default BlockBookmark;