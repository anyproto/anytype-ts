import * as React from 'react';
import { PreviewLink, PreviewObject } from 'ts/component';
import { I, Util, DataUtil, Mark, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { commonStore, menuStore } from 'ts/store';

interface Props {}
interface State {
	object: any;
};

const $ = require('jquery');
const raf = require('raf');

const OFFSET_Y = 8;
const BORDER = 12;

const Preview = observer(class Preview extends React.Component<Props, State> {
	
	state = {
		object: null,
	};
	ref: any = null;
	
	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onUnlink = this.onUnlink.bind(this);
		this.position = this.position.bind(this);
		this.setObject = this.setObject.bind(this);
	};
	
	render () {
		const { preview } = commonStore;
		const { type, param, noUnlink } = preview;
		const cn = [ 'preview' ];

		let head = null;
		let content = null;

		switch (type) {
			case I.MarkType.Link:
				head = (
					<div className="head">
						<div id="button-copy" className="item" onClick={this.onCopy}>{translate('previewCopy')}</div>
						<div id="button-edit" className="item" onClick={this.onEdit}>{translate('previewEdit')}</div>
						{!noUnlink ? <div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('previewUnlink')}</div> : ''}
					</div>
				);

				content = <PreviewLink ref={(ref: any) => { this.ref = ref; }} url={param} position={this.position} />;
				break;

			case I.MarkType.Object:
				if (!noUnlink) {
					head = (
						<div className="head">
							<div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('previewUnlink')}</div>
						</div>
					);
				};

				content = <PreviewObject ref={(ref: any) => { this.ref = ref; }} rootId={param} setObject={this.setObject} position={this.position} />;
				break;
		};

		if (head) {
			cn.push('withHead');
		};

		return (
			<div id="preview" className={cn.join(' ')}>
				<div className="polygon" onClick={this.onClick} />
				<div className="content">
					{head}

					<div className="cp" onClick={this.onClick}>
						{content}
					</div>
				</div>
			</div>
		);
	};
	
	onClick (e: any) {
		const { preview } = commonStore;
		const { type, param } = preview;
		const { object } = this.state;
		const renderer = Util.getRenderer();

		switch (type) {
			case I.MarkType.Link:
				renderer.send('urlOpen', param);	
				break;

			case I.MarkType.Object:
				DataUtil.objectOpenEvent(e, object);
				break;
		};
	};
	
	onCopy (e: any) {
		const { preview } = commonStore;
		const { param } = preview;
		
		Util.clipboardCopy({ text: param });
		Util.previewHide(true);
	};
	
	onEdit (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { preview } = commonStore;
		const { marks, range, onChange } = preview;
		const rect = Util.objectCopy($('#preview').get(0).getBoundingClientRect());
		const mark = Mark.getInRange(marks, I.MarkType.Link, { from: range.from, to: range.to });

		menuStore.open('blockLink', {
			rect: { ...rect, height: 0, y: rect.y + $(window).scrollTop() },
			horizontal: I.MenuDirection.Center,
			onOpen: () => { Util.previewHide(true); },
			data: {
				filter: mark ? mark.param : '',
				type: mark ? mark.type : null,
				onChange: (newType: I.MarkType, param: string) => {
					onChange(Mark.toggleLink({ type: newType, param: param, range: range }, marks));
				}
			}
		});
	};
	
	onUnlink (e: any) {
		const { preview } = commonStore;
		const { type, range, onChange } = preview;
		
		onChange(Mark.toggleLink({ type: type, param: '', range: range }, preview.marks));
		Util.previewHide(true);
	};

	setObject (object: any) {
		this.setState({ object });
	};

	position () {
		const { preview } = commonStore;
		const { element } = preview;
		
		if (!element || !element.length) {
			return;
		};

		const win = $(window);
		const obj = $('#preview');
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
		let pcss: any = { top: 'auto', bottom: 'auto', width: '', left: '', height: nh + OFFSET_Y, clipPath: '' };
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

		if (offset.top + oh + nh >= st + wh) {
			typeY = I.MenuDirection.Top;
		};
		
		if (typeY == I.MenuDirection.Top) {
			css.top = offset.top - oh - OFFSET_Y;
			obj.addClass('top');
				
			pcss.bottom = -nh - OFFSET_Y;
			pcss.clipPath = cpTop;
		};
			
		if (typeY == I.MenuDirection.Bottom) {
			css.top = offset.top + nh + OFFSET_Y;
			obj.addClass('bottom');
				
			pcss.top = -nh - OFFSET_Y;
			pcss.clipPath = cpBot;
		};
			
		css.left = offset.left - ow / 2 + nw / 2;
		css.left = Math.max(BORDER, css.left);
		css.left = Math.min(ww - ow - BORDER, css.left);

		obj.show().css(css);
		poly.css(pcss);
		
		raf(() => { 
			obj.css({ opacity: 1 });
		});
	};

});

export default Preview;