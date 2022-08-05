import * as React from 'react';
import { Loader, IconObject, Cover, Icon } from 'ts/component';
import { commonStore, detailStore, blockStore, dbStore } from 'ts/store';
import { I, C, DataUtil, Action } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
	className?: string;
	onClick? (e: any): void;
	position?: () => void;
	setObject?: (object: any) => void;
};

interface State {
	loading: boolean;
};

const Constant = require('json/constant.json');
const Colors = [ 'yellow', 'red', 'ice', 'lime' ];

const PreviewObject = observer(class PreviewObject extends React.Component<Props, State> {
	
	state = {
		loading: false,
	};
	isOpen: boolean = false;
	_isMounted: boolean = false;
	id: string = '';

	public static defaultProps = {
		className: '',
	};
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { loading } = this.state;
		const { rootId, className, onClick } = this.props;
		const contextId = this.getRootId();

		const check = DataUtil.checkDetails(contextId, rootId);
		const object = check.object;
		const { name, description, coverType, coverId, coverX, coverY, coverScale } = object;
		const author = detailStore.get(contextId, object.creator, []);
		const type = detailStore.get(Constant.subId.type, object.type, []);
		const childBlocks = blockStore.getChildren(contextId, rootId, it => !it.isLayoutHeader()).slice(0, 10);
		const isTask = object.layout == I.ObjectLayout.Task;
		const cn = [ 'previewObject' , check.className, className ];

		let n = 0;
		let c = 0;

		const Block = (item: any) => {
			const { content, fields } = item;
			const { text, style, checked } = content;
			const childBlocks = blockStore.getChildren(contextId, item.id);
			const length = childBlocks.length;

			let bullet = null;
			let inner = null;
			let isRow = false;
			let cn = [ 'element', DataUtil.blockClass(item), item.className ];

			switch (item.type) {
				case I.BlockType.Text:
					if (!text) {
						break;
					};

					if ([ I.TextStyle.Checkbox, I.TextStyle.Bulleted, I.TextStyle.Numbered, I.TextStyle.Quote ].indexOf(style) >= 0) {
						cn.push('withBullet');
					};

					switch (style) {
						default:
							inner = <div className="line" />;
							break;

						case I.TextStyle.Header1:
						case I.TextStyle.Header2:
						case I.TextStyle.Header3:
							inner = text;
							break;

						case I.TextStyle.Checkbox:
							inner = (
								<React.Fragment>
									<Icon className={[ 'check', (checked ? 'active' : '') ].join(' ')} />
									<div className="line" />
								</React.Fragment>
							);
							break;

						case I.TextStyle.Quote:
							inner = (
								<React.Fragment>
									<Icon className="hl" />
									<div className="line" />
								</React.Fragment>
							);
							break;

						case I.TextStyle.Bulleted:
							inner = (
								<React.Fragment>
									<Icon className="bullet" />
									<div className="line" />
								</React.Fragment>
							);
							break;

						case I.TextStyle.Toggle:
							inner = (
								<React.Fragment>
									<Icon className="toggle" />
									<div className="line" />
								</React.Fragment>
							);
							break;

						case I.TextStyle.Numbered:
							inner = (
								<React.Fragment>
									<div id={'marker-' + item.id} className="number" />
									<div className="line" />
								</React.Fragment>
							);
							break;
					};
					break;

				case I.BlockType.Layout:
					if (style == I.LayoutStyle.Row) {
						isRow = true;
					};
					break;

				case I.BlockType.Relation:
					inner = (
						<React.Fragment>
							<div className="line" />
							<div className="line" />
						</React.Fragment>
					);
					break;

				case I.BlockType.File:
					if ([ I.FileState.Empty, I.FileState.Error ].indexOf(content.state) >= 0) {
						break;
					};

					switch (content.type) {
						default: 
						case I.FileType.File: 
							bullet = <div className={[ 'bullet', 'bgColor', 'bgColor-' + Colors[c] ].join(' ')} />
							inner = (
								<React.Fragment>
									<Icon className="color" inner={bullet} />
									<div className="line" />
								</React.Fragment>
							);

							c++;
							if (c > Colors.length - 1) {
								c = 0;
							};
							break;
							
						case I.FileType.Image:
							let css: any = {};
		
							if (fields.width) {
								css.width = (fields.width * 100) + '%';
							};
							inner = <img className="media" src={commonStore.imageUrl(content.hash, Constant.size.image)} style={css} />
							break;
							
						case I.FileType.Video: 
							break;
					};
					break;

				case I.BlockType.Link:
					bullet = <div className={[ 'bullet', 'bgColor', 'bgColor-' + Colors[c] ].join(' ')} />
					inner = (
						<React.Fragment>
							<Icon className="color" inner={bullet} />
							<div className="line" />
						</React.Fragment>
					);

					c++;
					if (c > Colors.length - 1) {
						c = 0;
					};
					break;

				case I.BlockType.Bookmark:
					if (!content.url) {
						break;
					};

					bullet = <div className={[ 'bullet', 'bgColor', 'bgColor-grey' ].join(' ')} />
					inner = (
						<div className="bookmark">
							<div className="side left">
								<div className="name">
									<div className="line odd" />
								</div>

								<div className="descr">
									<div className="line even" />
									<div className="line odd" />
								</div>

								<div className="url">
									<Icon className="color" inner={bullet} />
									<div className="line even" />
								</div>
							</div>
							<div className="side right" style={{ backgroundImage: `url("${commonStore.imageUrl(content.imageHash, 170)}")` }} />
						</div>
					);
					break;
			};

			return (
				<div className={cn.join(' ')} style={item.css}>
					{inner ? (
						<div className="inner">
							{inner}
						</div>
					) : ''}

					{length ? (
						<div className="children">
							{childBlocks.map((child: any, i: number) => {
								const css: any = {};
								const cn = [ n % 2 == 0 ? 'even' : 'odd' ];

								if (i == 0) {
									cn.push('first');
								};

								if (i == childBlocks.length - 1) {
									cn.push('last');
								};

								if (isRow) {
									css.width = (child.fields.width || 1 / length ) * 100 + '%';
								};

								n++;
								n = this.checkNumber(child, n);
								return <Block key={child.id} {...child} className={cn.join(' ')} css={css} />
							})}
						</div>
					) : ''}
				</div>
			);
		};

		return (
			<div className={cn.join(' ')} onClick={onClick}>
				{loading ? <Loader /> : (
					<React.Fragment>
						<div className="scroller">
							{object.templateIsBundled ? <Icon className="logo" tooltip="Template is bundled" /> : ''}

							{coverType && coverId ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
							<div className="heading">
								{isTask ? (
									<Icon className={[ 'checkbox', (object.done ? 'active' : '') ].join(' ')} />
								) : (
									<IconObject size={48} iconSize={32} object={object} />
								)}
								<div className="name">{name}</div>
								<div className="description">{description}</div>
								<div className="featured">
									{type.name}
									<div className="bullet" />
									{author.name}
								</div>
							</div>
							<div className="blocks">
								{childBlocks.map((child: any, i: number) => {
									const cn = [ n % 2 == 0 ? 'even' : 'odd' ];

									if (i == 0) {
										cn.push('first');
									};

									if (i == childBlocks.length - 1) {
										cn.push('last');
									};

									n++;
									n = this.checkNumber(child, n);
									return <Block key={child.id} className={cn.join(' ')} {...child} />;
								})}
							</div>
						</div>
						<div className="border" />
					</React.Fragment>
				)}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.load();
	};

	componentDidUpdate () {
		const { rootId, position } = this.props;
		const contextId = this.getRootId();
		const root = blockStore.wrapTree(contextId, rootId);

		this.load();

		if (root) {
			blockStore.updateNumbersTree([ root ]);
		};

		if (position) {
			position();
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		Action.pageClose(this.getRootId(), false);
	};

	load () {
		const { loading } = this.state;
		const { rootId, position, setObject } = this.props;
		const contextId = this.getRootId();

		if (!this._isMounted || loading || (this.id == rootId)) {
			return;
		};

		this.id = rootId;
		this.setState({ loading: true });

		C.ObjectShow(rootId, 'preview', (message: any) => {
			if (!this._isMounted) {
				return;
			};

			this.setState({ loading: false });

			if (setObject) {
				setObject(detailStore.get(contextId, rootId, []));
			};
		});
	};

	checkNumber (block: I.Block, n: number) {
		const isText = block.type == I.BlockType.Text;
		if ([ I.BlockType.Layout ].indexOf(block.type) >= 0) {
			n = 0;
		};
		if (isText && ([ I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3 ].indexOf(block.content.style) >= 0)) {
			n = 0;
		};
		return n;
	};

	getRootId () {
		const { rootId } = this.props;
		return [ rootId, 'preview' ].join('-');
	};

	update () {
		this.id = '';
		this.load();
	};

});

export default PreviewObject;