import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, ObjectName, ObjectDescription, Loader } from 'ts/component';
import { I, C, focus, Util } from 'ts/lib';
import { commonStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

interface State {
	loading: boolean;
};

const $ = require('jquery');

const BlockBookmark = observer(class BlockBookmark extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		loading: false,
	};

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onChangeUrl = this.onChangeUrl.bind(this);
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const object = detailStore.get(rootId, block.content.targetObjectId);
		const { iconImage, picture, url } = object;
		const { loading } = this.state;

		let element = null;
		if (loading) {
			element = <Loader />;
		} else 
		if (url) {
			let cn = [ 'inner', 'resizable' ];
			let cnl = [ 'side', 'left' ];
				
			if (picture) {
				cn.push('withImage');
			};

			if (block.bgColor) {
				cnl.push('bgColor bgColor-' + block.bgColor);
			};
			
			element = (
				<div className={cn.join(' ')} data-href={url} onClick={this.onClick}>
					<div className={cnl.join(' ')}>
						<ObjectName object={object} />
						<ObjectDescription object={object} />
						<div className="link">
							{iconImage ? <img src={commonStore.imageUrl(iconImage, 16)} className="fav" /> : ''}
							{url}
						</div>
					</div>
					<div className="side right">
						{picture ? <img src={commonStore.imageUrl(picture, 500)} className="img" /> : ''}
					</div>
				</div>
			);
		} else {
			element = (
				<InputWithFile block={block} icon="bookmark" textFile="Paste a link" withFile={false} onChangeUrl={this.onChangeUrl} readonly={readonly} />
			);
		};
		
		return (
			<div className={[ 'focusable', 'c' + block.id ].join(' ')} tabIndex={0} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onFocus={this.onFocus}>
				{element}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.resize();
		this.rebind();
	};
	
	componentDidUpdate () {
		this.resize();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 });
		};
	};
	
	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 });
		};
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};
	
	onClick (e: any) {
		if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
			return;
		};

		const { rootId, block } = this.props;
		const object = detailStore.get(rootId, block.content.targetObjectId);
		const renderer = Util.getRenderer();

		renderer.send('urlOpen', Util.urlFix(object.url));
	};
	
	onChangeUrl (e: any, url: string) {
		const { rootId, block } = this.props;
		
		this.setState({ loading: true });
		C.BlockBookmarkFetch(rootId, block.id, url, (message: any) => {
			this.setState({ loading: false });
		});
	};
	
	rebind () {
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

		const { getWrapperWidth } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const inner = node.find('.inner');
		const rect = node.get(0).getBoundingClientRect() as DOMRect;
		const width = rect.width;
		const mw = getWrapperWidth();

		width <= mw / 2 ? inner.addClass('vertical') : inner.removeClass('vertical');
	};
	
});

export default BlockBookmark;