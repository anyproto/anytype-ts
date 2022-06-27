import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { InputWithFile, ObjectName, ObjectDescription, Loader, Error } from 'ts/component';
import { I, C, focus, Util, translate } from 'ts/lib';
import { commonStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.BlockComponent {};

const $ = require('jquery');

const BlockBookmark = observer(class BlockBookmark extends React.Component<Props, {}> {

	_isMounted: boolean = false;

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
		const { state } = block.content;
		const object = detailStore.get(rootId, block.content.targetObjectId);
		const { iconImage, picture, url } = object;

		let element = null;
		switch (state) {
			default:
			case I.BookmarkState.Error:
			case I.BookmarkState.Empty:
				element = (
					<React.Fragment>
						{state == I.BookmarkState.Error ? <Error text={translate('blockBookmarkError')} /> : ''}
						<InputWithFile 
							block={block} 	
							icon="bookmark" 
							textFile="Paste a link" 
							withFile={false} 
							onChangeUrl={this.onChangeUrl} 
							readonly={readonly} 
						/>
					</React.Fragment>
				);
				break;
				
			case I.BookmarkState.Fetching:
				element = <Loader />;
				break;
				
			case I.BookmarkState.Done:
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
				break;
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
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
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

		C.BlockBookmarkFetch(rootId, block.id, url);
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