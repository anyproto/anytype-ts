import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Label, Icon } from 'ts/component';
import { I, Docs, Storage, Util } from 'ts/lib';
import Block from 'ts/component/block/help';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

const Url = require('json/url.json');
const { ipcRenderer } = window.require('electron');
const $ = require('jquery');
const raf = require('raf');

class PopupHelp extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { document } = data;
		const doc = Docs.Help[Util.toUpperCamelCase(document)] || [];
		const title = doc.find((it: any) => { return (it.type == I.BlockType.Text) && (it.style == I.TextStyle.Title); });

		return (
			<div className="wrapper">
				<div className="head">
					<div className="side left">
						{title ? <Label text={title.text} /> : ''}
					</div>
					{document == 'whatsNew' ? (
						<div className="side right">
							<Label text="Stay tuned for Anytype’s news " />
							<Icon onClick={(e) => { this.onUrl(Url.telegram); }} className="telegram" />
							<Icon onClick={(e) => { this.onUrl(Url.twitter); }} className="twitter" />
						</div>
					) : ''}
				</div>
				
				<div className="editor help">
					<div className="blocks">
						{doc.map((item: any, i: number) => (
							<Block key={i} {...this.props} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { param } = this.props;
		const { data } = param;
		const { document } = data;
		
		if (document == 'whatsNew') {
			Storage.set('popupNewBlock', 1);
		};

		this.renderLinks();
		this.rebind();
	};

	componentDidUpdate () {
		this.renderLinks();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	renderLinks () {
		const node = $(ReactDOM.findDOMNode(this));
		const self = this;

		node.find('a').unbind('click').click(function (e: any) {
			e.preventDefault();
			self.onUrl($(this).attr('href'));
		});
	};
	
	onUrl (url: string) {
		ipcRenderer.send('urlOpen', url);
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.unbind('resize.navigation').on('resize.navigation', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('keydown.navigation resize.navigation');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
			const win = $(window);
			const obj = $('#popupHelp #innerWrap');
			const width = Math.max(732, Math.min(960, win.width() - 128));

			obj.css({ width: width, marginLeft: -width / 2, marginTop: 0 });
		});
	};
	
};

export default PopupHelp;