import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { commonStore, menuStore } from 'ts/store';
import { Icon, Loader } from 'ts/component';
import { observer } from 'mobx-react';
import { I, C, Mark, Util, translate } from 'ts/lib';

interface Props {}
interface State {
	loading: boolean;
	title: string;
	description: string;
	url: string;
	faviconUrl: string;
	imageUrl: string;
}

const $ = require('jquery');
const raf = require('raf');
const { ipcRenderer } = window.require('electron');

const OFFSET_Y = 8;
const BORDER = 12;

const LinkPreview = observer(class LinkPreview extends React.Component<Props, State> {
	
	state = {
		loading: false,
		title: '',
		description: '',
		url: '',
		faviconUrl: '',
		imageUrl: '',
	};
	lastUrl: string;
	
	constructor (props: any) {
		super(props);
		
		this.onCopy = this.onCopy.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onUnlink = this.onUnlink.bind(this);
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		let { loading, title, description, url, faviconUrl, imageUrl } = this.state;
		const { linkPreview } = commonStore;
		
		let content = null;
		let style: any = {};
		if (imageUrl) {
			style.backgroundImage = 'url("' + imageUrl + '")';
		};
		
		if (loading) {
			content = <Loader />
		} else 
		if (url) {
			content = (
				<React.Fragment>
					<div className="head">
						<div id="button-copy" className="item" onClick={this.onCopy}>{translate('linkPreviewCopy')}</div>
						<div id="button-edit" className="item" onClick={this.onEdit}>{translate('linkPreviewEdit')}</div>
						<div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('linkPreviewUnlink')}</div>
					</div>
					<div className="cp" onClick={this.onClick}>
						{imageUrl ? <div className="img" style={style} /> : ''}
						<div className="info">
							{title ? <div className="name">{title}</div> : ''}
							{description ? <div className="descr">{description}</div> : ''}
							<div className="link">
								{faviconUrl ? <Icon icon={faviconUrl} className="fav" /> : ''}
								{url}
							</div> 
						</div>
					</div>
				</React.Fragment>
			);
		};
		
		return (
			<div id="linkPreview" className="linkPreview">
				<div className="polygon" onClick={this.onClick} />
				<div className="content">{content}</div>
			</div>
		);
	};
	
	componentDidUpdate () {
		const { loading, url, imageUrl } = this.state;
		const { linkPreview } = commonStore;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!loading && (this.lastUrl != linkPreview.url)) {
			this.setState({ 
				loading: true,
				url: linkPreview.url,
				title: '',
				description: '',
				faviconUrl: '',
				imageUrl: '',
			});

			this.lastUrl = linkPreview.url;
			
			C.LinkPreview(linkPreview.url, (message: any) => {
				if (message.error.code) {
					this.setState({ loading: false });
					return;
				};

				this.setState({
					...message.linkPreview,
					loading: false,
				});
			});
		};
		
		imageUrl ? node.addClass('withImage') : node.removeClass('withImage');
		if (Util.linkPreviewOpen) {
			this.show();
		};
	};
	
	onClick (e: any) {
		const { url } = this.state;
		ipcRenderer.send('urlOpen', url);		
	};
	
	onCopy (e: any) {
		const { linkPreview } = commonStore;
		
		Util.clipboardCopy({ text: linkPreview.url });
		Util.linkPreviewHide(true);
	};
	
	onEdit (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { linkPreview } = commonStore;
		const rect = Util.objectCopy($('#linkPreview').get(0).getBoundingClientRect());

		let { marks, range, onChange } = linkPreview;
		let mark = Mark.getInRange(marks, I.MarkType.Link, { from: range.from, to: range.to });

		menuStore.open('blockLink', {
			rect: { ...rect, height: 0, y: rect.y + $(window).scrollTop() },
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				Util.linkPreviewHide(true);
			},
			data: {
				filter: (mark ? mark.param : ''),
				onChange: (param: string) => {
					marks = Mark.toggle(marks, { type: I.MarkType.Link, param: param, range: range });
					onChange(marks);
				}
			}
		});
	};
	
	onUnlink (e: any) {
		const { linkPreview } = commonStore;
		let { marks, range, onChange } =  linkPreview;
		
		marks = Mark.toggle(marks, { type: I.MarkType.Link, param: '', range: { from: range.from, to: range.to } });
		onChange(marks);
		
		Util.linkPreviewHide(true);
	};
	
	show () {
		const { linkPreview } = commonStore;
		const { element } = linkPreview;
		const win = $(window);
		const obj = $('#linkPreview');
		const poly = obj.find('.polygon');
		const ww = win.width();
		const wh = win.height();
		const st = win.scrollTop();
		const offset = element.offset();
		const nw = element.outerWidth();
		const nh = element.outerHeight();
		const ow = obj.outerWidth();
		const oh = obj.outerHeight();

		let css: any = { opacity: 0, left: 0, top: 0 };
		let pcss: any = { top: 'auto', bottom: 'auto', width: '', left: '', height: nh + OFFSET_Y };
		let typeY = I.MenuDirection.Bottom;		
		let ps = (1 - nw / ow) / 2 * 100;
		let pe = ps + nw / ow * 100;
		let cpTop = 'polygon(0% 0%, ' + ps + '% 100%, ' + pe + '% 100%, 100% 0%)';
		let cpBot = 'polygon(0% 100%, ' + ps + '% 0%, ' + pe + '% 0%, 100% 100%)';
		
		if (ow < nw) {
			pcss.width = nw;
			pcss.left = (ow - nw) / 2;
			ps = (nw - ow) / nw / 2 * 100;
			pe = (1 - (nw - ow) / nw / 2) * 100;
			
			cpTop = 'polygon(0% 100%, ' + ps + '% 0%, ' + pe + '% 0%, 100% 100%)';
			cpBot = 'polygon(0% 0%, ' + ps + '% 100%, ' + pe + '% 100%, 100% 0%)';
		};
		
		obj.removeClass('top bottom');
		poly.css(pcss);
		
		if (offset.top + oh + nh >= st + wh) {
			typeY = I.MenuDirection.Top;
		};
		
		if (typeY == I.MenuDirection.Top) {
			css.top = offset.top - oh - OFFSET_Y;
			obj.addClass('top');
				
			poly.css({ bottom: -nh - OFFSET_Y, clipPath: cpTop });
		};
			
		if (typeY == I.MenuDirection.Bottom) {
			css.top = offset.top + nh + OFFSET_Y;
			obj.addClass('bottom');
				
			poly.css({ top: -nh - OFFSET_Y, clipPath: cpBot });
		};
			
		css.left = offset.left - ow / 2 + nw / 2;
		css.left = Math.max(BORDER, css.left);
		css.left = Math.min(ww - ow - BORDER, css.left);
		
		obj.show().css(css);
		
		raf(() => { 
			obj.css({ opacity: 1 });
		});
	};
	
});

export default LinkPreview;