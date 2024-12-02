import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import * as Docs from 'Docs';
import { Label, Icon, Cover, Button } from 'Component';
import { I, U, J, translate, Action } from 'Lib';
import Block from 'Component/block/help';

interface State {
	page: number;
};

const LIMIT = 1;

class PopupHelp extends React.Component<I.Popup, State> {

	_isMounted = false;
	node: any = null;
	state = {
		page: 0,
	};
	
	render () {
		const { page } = this.state;
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

		const length = sections.length;

		if (isWhatsNew) {
			sections = sections.slice(page, page + LIMIT);
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
						<Icon onClick={() => Action.openUrl(J.Url.mail)} className="mail" />
					</div>
				</div>
				
				<div className={[ 'editor', 'help', (cover ? 'withCover' : '') ].join(' ')}>
					{cover ? <Cover {...cover.param} /> : ''}

					<div className="blocks">
						{sections.map((section: any, i: number) => (
							<Section key={i} {...this.props} {...section} />
						))}
					</div>

					{isWhatsNew ? (
						<div className="buttons">
							{page < length - 1 ? <Button className="c28" text={translate('popupHelpPrevious')} onClick={() => this.onArrow(1)} /> : ''}
							{page > 0 ? <Button className="c28" text={translate('popupHelpNext')} onClick={() => this.onArrow(-1)} /> : ''}
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

		U.Common.renderLinks($(this.node));
	};

	componentDidUpdate () {
		this.resize();

		U.Common.renderLinks($(this.node));
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).off('resize.popupHelp').on('resize.popupHelp', () => this.resize());
	};

	unbind () {
		$(window).off('resize.help');
	};

	getDocument () {
		const { param } = this.props;
		const { data } = param;

		return U.Common.toUpperCamelCase(data.document);
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

	onArrow (dir: number) {
		const { getId } = this.props;
		const { page } = this.state;
		const length = this.getSections().length;
		const obj = $(`#${getId()}-innerWrap`);

		if ((page + dir < 0) || (page + dir >= length)) {
			return;
		};

		obj.scrollTop(0);
		this.setState({ page: page + dir });
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const loader = obj.find('#loader');
		const hh = J.Size.header;

		loader.css({ width: obj.width(), height: obj.height() });
		position();

		raf(() => { obj.css({ top: hh + 20, marginTop: 0 }); });
	};

};

export default PopupHelp;
