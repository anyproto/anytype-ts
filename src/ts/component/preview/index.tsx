import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { PreviewLink, PreviewObject, PreviewDefault, Loader } from 'Component';
import { I, UtilCommon, UtilObject, Preview, Mark, translate, Renderer } from 'Lib';
import { commonStore, menuStore } from 'Store';

const OFFSET_Y = 8;
const BORDER = 12;

interface State {
	object: any;
};

const PreviewComponent = observer(class PreviewComponent extends React.Component<object, State> {

	ref = null;
	state = {
		object: null,
	};
	
	constructor (props) {
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
		const { type, target, noUnlink, object } = preview;
		const cn = [ 'previewWrapper' ];

		let head = null;
		let content = null;

		switch (type) {
			case I.PreviewType.Link: {
				head = (
					<div className="head">
						<div id="button-copy" className="item" onClick={this.onCopy}>{translate('previewCopy')}</div>
						<div id="button-edit" className="item" onClick={this.onEdit}>{translate('previewEdit')}</div>
						{!noUnlink ? <div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('commonUnlink')}</div> : ''}
					</div>
				);

				content = <PreviewLink ref={ref => this.ref = ref} url={target} position={this.position} />;
				break;
			};

			case I.PreviewType.Object: {
				if (!noUnlink) {
					head = (
						<div className="head">
							<div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('commonUnlink')}</div>
						</div>
					);
				};

				content = <PreviewObject ref={ref => this.ref = ref} rootId={target} setObject={this.setObject} position={this.position} />;
				break;
			};

			case I.PreviewType.Default: {
				if (!noUnlink) {
					head = (
						<div className="head">
							<div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('commonUnlink')}</div>
						</div>
					);
				};

				content = <PreviewDefault ref={ref => this.ref = ref} rootId={target} object={object} setObject={this.setObject} position={this.position} />;
				break;
			};
		};

		if (head) {
			cn.push('withHead');
		};

		return (
			<div id="preview" className={cn.join(' ')}>
				<div className="polygon" onClick={this.onClick} />
				<div className="content">
					{head}

					<div onClick={this.onClick}>
						{content}
					</div>
				</div>
			</div>
		);
	};

	onClick (e: React.MouseEvent) {
		if (e.button) {
			return;
		};

		const { preview } = commonStore;
		const { type, target } = preview;
		const { object } = this.state;

		switch (type) {
			case I.PreviewType.Link: {
				Renderer.send('urlOpen', target);	
				break;
			};

			case I.PreviewType.Default:
			case I.PreviewType.Object: {
				UtilObject.openEvent(e, object);
				break;
			};
		};
	};
	
	onCopy () {
		const { preview } = commonStore;
		const { target } = preview;
		
		UtilCommon.clipboardCopy({ text: target });
		Preview.previewHide(true);
	};
	
	onEdit (e) {
		e.preventDefault();
		e.stopPropagation();

		const { preview } = commonStore;
		const { marks, range, onChange } = preview;
		const mark = Mark.getInRange(marks, I.MarkType.Link, range);
		const win = $(window);
		const rect = UtilCommon.objectCopy($('#preview').get(0).getBoundingClientRect());

		menuStore.open('blockLink', {
			rect: rect ? { ...rect, height: 0, y: rect.y + win.scrollTop() } : null, 
			horizontal: I.MenuDirection.Center,
			onOpen: () => { Preview.previewHide(true); },
			data: {
				filter: mark ? mark.param : '',
				type: mark ? mark.type : null,
				onChange: (newType: I.MarkType, param: string) => {
					onChange(Mark.toggleLink({ type: newType, param, range }, marks));
				}
			}
		});
	};
	
	onUnlink () {
		const { preview } = commonStore;
		const { range, onChange } = preview;

		onChange(Mark.toggleLink({ type: this.getMarkType(), param: '', range }, preview.marks));
		Preview.previewHide(true);
	};

	getMarkType () {
		const { preview } = commonStore;
		const { type } = preview;

		switch (type) {
			case I.PreviewType.Link: {
				return I.MarkType.Link;
			};

			case I.PreviewType.Default:
			case I.PreviewType.Object: {
				return I.MarkType.Object;
			};
		};
	};

	setObject (object) {
		this.setState({ object });
	};

	position () {
		const { preview } = commonStore;
		const { element, rect } = preview;

		if (!element && !rect) {
			return;
		};

		const win = $(window);
		const obj = $('#preview');
		const poly = obj.find('.polygon');
		const { ww, wh } = UtilCommon.getWindowDimensions();
		const st = win.scrollTop();
		const ow = obj.outerWidth();
		const oh = obj.outerHeight();

		let ox = 0;
		let oy = 0;
		let nw = 0;
		let nh = 0;

		if (rect) {
			ox = rect.x;
			oy = rect.y;
			nw = rect.width;
			nh = rect.height;
		} else 
		if (element && element.length) {
			const offset = element.offset();

			ox = offset.left;
			oy = offset.top;
			nw = element.outerWidth();
			nh = element.outerHeight();
		}; 

		const css: any = { opacity: 0, left: 0, top: 0 };
		const pcss: any = { top: 'auto', bottom: 'auto', width: '', left: '', height: nh + OFFSET_Y, clipPath: '' };

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

		if (oy + oh + nh >= st + wh) {
			typeY = I.MenuDirection.Top;
		};
		
		if (typeY == I.MenuDirection.Top) {
			css.top = oy - oh - OFFSET_Y;
			css.transform = 'translateY(-5%)';
				
			pcss.bottom = -nh - OFFSET_Y;
			pcss.clipPath = cpTop;
		};
			
		if (typeY == I.MenuDirection.Bottom) {
			css.top = oy + nh + OFFSET_Y;
			css.transform = 'translateY(5%)';
				
			pcss.top = -nh - OFFSET_Y;
			pcss.clipPath = cpBot;
		};
			
		css.left = ox - ow / 2 + nw / 2;
		css.left = Math.max(BORDER, css.left);
		css.left = Math.min(ww - ow - BORDER, css.left);

		obj.show().css(css);

		if (!preview.noAnimation) {
			obj.addClass('anim');
		};

		poly.css(pcss);
		
		window.setTimeout(() => { obj.css({ opacity: 1, transform: 'translateY(0%)' }); }, 15);
	};

});

export default PreviewComponent;