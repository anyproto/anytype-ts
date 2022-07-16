import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Label, Icon, Cover } from 'ts/component';
import { I, Docs, Util, translate } from 'ts/lib';
import Block from 'ts/component/block/help';

interface Props extends I.Popup, RouteComponentProps<any> {};

const Url = require('json/url.json');
const $ = require('jquery');
const raf = require('raf');

class PopupHelp extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { document } = data;
		
		let doc = Docs.Help[Util.toUpperCamelCase(document)] || [];
		let title = doc.find((it: any) => { return it.style == I.TextStyle.Title; });
		let cover = doc.find((it: any) => { return it.type == I.BlockType.Cover; });

		doc = doc.filter((it: any) => { return it.type != I.BlockType.Cover; });

		return (
			<div className="wrapper">
				<div className="head">
					<div className="side left">
						{title ? <Label text={title.text} /> : ''}
					</div>
					<div className="side right">
						<Label text={translate('popupHelpLabel')} />
						<Icon onClick={(e) => { Util.onUrl(Url.telegram); }} className="telegram" />
						<Icon onClick={(e) => { Util.onUrl(Url.twitter); }} className="twitter" />
					</div>
				</div>
				
				<div className={[ 'editor', 'help', (cover ? 'withCover' : '') ].join(' ')}>
					{cover ? <Cover {...cover.param} /> : ''}

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
		this.rebind();
		this.resize();

		Util.renderLink($(ReactDOM.findDOMNode(this)));
	};

	componentDidUpdate () {
		this.resize();

		Util.renderLink($(ReactDOM.findDOMNode(this)));
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.unbind('resize.help').on('resize.help', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.help');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
			const { getId } = this.props;
			const win = $(window);
			const obj = $(`#${getId()}-innerWrap`);
			const width = Math.max(732, Math.min(960, win.width() - 128));

			obj.css({ width: width, marginLeft: -width / 2 });
		});
	};
	
};

export default PopupHelp;