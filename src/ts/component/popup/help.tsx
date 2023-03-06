import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import * as Docs from 'Docs';
import { RouteComponentProps } from 'react-router';
import { Label, Icon, Cover, Button } from 'Component';
import { I, Util, translate } from 'Lib';
import Block from 'Component/block/help';
import Url from 'json/url.json';

interface Props extends I.Popup, RouteComponentProps<any> {};

interface State {
	showFull: boolean;
};

class PopupHelp extends React.Component<Props, State> {

	_isMounted = false;
	node: any = null;
	state = {
		showFull: false,
	};
	
	render () {
		const { showFull } = this.state;
		const document = this.getDocument();
		const blocks = this.getBlocks();
		const title = blocks.find(it => it.style == I.TextStyle.Title);
		const cover = blocks.find(it => it.type == I.BlockType.Cover);
		const isWhatsNew = document == 'WhatsNew';

		const Section = (item: any) => (
			<div className="section">
				{item.children.map((child: any, i: number) => (
					<Block key={i} {...this.props} {...child} />
				))}
			</div>
		);

		let sections = this.getSections();
		if (isWhatsNew && !showFull) {
			sections = sections.slice(0, 3);
		};

		return (
			<div 
				ref={node => this.node = node}
				className="wrapper"
			>
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
						{sections.map((section: any, i: number) => (
							<Section key={i} {...this.props} {...section} />
						))}
					</div>

					{isWhatsNew && !showFull ? (
						<div className="buttons">
							<Button text="Older releases" onClick={() => { this.setState({ showFull: true }) }} />
						</div>
					) : ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();

		Util.renderLinks($(this.node));
	};

	componentDidUpdate () {
		this.resize();

		Util.renderLinks($(this.node));
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
		win.off('resize.help').on('resize.help', () => { this.resize(); });
	};

	unbind () {
		$(window).off('resize.help');
	};

	getDocument () {
		const { param } = this.props;
		const { data } = param;

		return Util.toUpperCamelCase(data.document);
	};

	getBlocks () {
		return Docs.Help[this.getDocument()] || [];
	};

	getSections (): any[] {
		const document = this.getDocument();
		const blocks = this.getBlocks().filter(it => it.type != I.BlockType.Cover);
		const sections: any[] = [];

		switch (document) {
			default: {
				sections.push({ children: blocks });
				break;
			};

			case 'WhatsNew': {
				let section = { children: [], header: null };
				for (const block of blocks) {
					if (!section.header && [ I.TextStyle.Title, I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3 ].includes(block.style)) {
						section.header = block;
					};

					section.children.push(block);

					if (block.type == I.BlockType.Div) {
						sections.push(section);
						section = { children: [], header: null };
					};
				};
				break;
			};
		};

		return sections;
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