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

const PreviewLink = observer(class PreviewLink extends React.Component<Props, State> {
	
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
		const { previewLink } = commonStore;
		
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
						<div id="button-copy" className="item" onClick={this.onCopy}>{translate('previewLinkCopy')}</div>
						<div id="button-edit" className="item" onClick={this.onEdit}>{translate('previewLinkEdit')}</div>
						<div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('previewLinkUnlink')}</div>
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
			<div id="previewLink" className="previewLink">
				<div className="polygon" onClick={this.onClick} />
				<div className="content">{content}</div>
			</div>
		);
	};
	
	componentDidUpdate () {
		const { loading, url, imageUrl } = this.state;
		const { previewLink } = commonStore;
		const node = $(ReactDOM.findDOMNode(this));
		
		if (!loading && (this.lastUrl != previewLink.url)) {
			this.setState({ 
				loading: true,
				url: previewLink.url,
				title: '',
				description: '',
				faviconUrl: '',
				imageUrl: '',
			});

			this.lastUrl = previewLink.url;
			
			C.LinkPreview(previewLink.url, (message: any) => {
				if (message.error.code) {
					this.setState({ loading: false });
					return;
				};

				this.setState({
					...message.previewLink,
					loading: false,
				});
			});
		};
		
		imageUrl ? node.addClass('withImage') : node.removeClass('withImage');
		if (Util.previewLinkOpen) {
			this.show();
		};
	};
	
	onClick (e: any) {
		const { url } = this.state;
		ipcRenderer.send('urlOpen', url);		
	};
	
	onCopy (e: any) {
		const { previewLink } = commonStore;
		
		Util.clipboardCopy({ text: previewLink.url });
		Util.previewLinkHide(true);
	};
	
	onEdit (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { previewLink } = commonStore;
		const rect = Util.objectCopy($('#previewLink').get(0).getBoundingClientRect());

		let { marks, range, onChange } = previewLink;
		let mark = Mark.getInRange(marks, I.MarkType.Link, { from: range.from, to: range.to });

		menuStore.open('blockLink', {
			rect: { ...rect, height: 0, y: rect.y + $(window).scrollTop() },
			horizontal: I.MenuDirection.Center,
			onOpen: () => {
				Util.previewLinkHide(true);
			},
			data: {
				filter: (mark ? mark.param : ''),
				onChange: (newType: I.MarkType, param: string) => {
					marks = Mark.toggle(marks, { type: newType, param: param, range: range });
					onChange(marks);
				}
			}
		});
	};
	
	onUnlink (e: any) {
		const { previewLink } = commonStore;
		let { marks, range, onChange } =  previewLink;
		
		marks = Mark.toggle(marks, { type: I.MarkType.Link, param: '', range: { from: range.from, to: range.to } });
		onChange(marks);
		
		Util.previewLinkHide(true);
	};
	
	show () {
		const { previewLink } = commonStore;
		const { element } = previewLink;
		const win = $(window);
		const obj = $('#previewLink');
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

export default PreviewLink;