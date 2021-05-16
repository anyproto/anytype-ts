import * as React from 'react';
import { Loader, IconObject, Cover, Icon } from 'ts/component';
import { detailStore, blockStore } from 'ts/store';
import { I, C, DataUtil } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props {
	rootId: string;
};
interface State {
	loading: boolean;
};

@observer
class ObjectPreviewBlock extends React.Component<Props, State> {
	
	state = {
		loading: false,
	};
	
	constructor (props: any) {
		super(props);
	};
	
	render () {
		const { loading } = this.state;
		const { rootId } = this.props;
		const object = detailStore.get(rootId, rootId);
		const { name, description, coverType, coverId, coverX, coverY, coverScale } = object;
		const author = detailStore.get(rootId, object.creator, []);
		const children = blockStore.getChildren(rootId, rootId, (it: I.Block) => {
			return !it.isLayoutHeader();
		}).slice(0, 5);
		const cn = [ 'objectPreviewBlock' , 'align' + object.layoutAlign ];

		if (coverId && coverType) {
			cn.push('withCover');
		};

		const bullet = <div className="bullet" />;

		let n = 0;

		const Block = (item: any) => {
			const { content, fields } = item;
			const { text, style } = content;
			const length = item.childBlocks.length;

			let inner = null;
			let isRow = false;
			let cn = '';

			switch (item.type) {
				case I.BlockType.Text:
					switch (style) {
						default:
							inner = <div className="line" />;
							break;

						case I.TextStyle.Header1:
						case I.TextStyle.Header2:
						case I.TextStyle.Header3:
							inner = content.text;
							break;

						case I.TextStyle.Checkbox:
							cn = 'withBullet';
							inner = (
								<React.Fragment>
									<Icon className="check" />
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
				case I.BlockType.Link:
					inner = (
						<React.Fragment>
							<Icon className="color" inner={bullet} />
							<div className="line" />
						</React.Fragment>
					);
					break;
			};

			return (
				<div id={'block-' + item.id} className={[ 'element', DataUtil.blockClass(item), item.className, cn ].join(' ')} style={item.css}>
					{inner ? (
						<div className="inner">
							{inner}
						</div>
					) : ''}

					{length ? (
						<div className="children">
							{item.childBlocks.map((child: any, i: number) => {
								let css: any = {};
								let cn = '';

								if (isRow) {
									css.width = (child.fields.width || 1 / length ) * 100 + '%';
								};

								if (child.type == I.BlockType.Text) {
									n++;
									if (n > 1) n = 0;
									cn = n % 2 ? 'even' : 'odd';
								};

								return <Block key={child.id} {...child} className={cn} css={css} />
							})}
						</div>
					) : ''}
				</div>
			);
		};

		let content = null;
		if (loading) {
			content = <Loader />;
		} else {
			content = (
				<React.Fragment>
					{coverType && coverId ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
					<div className="heading">
						<IconObject size={48} iconSize={32} object={object} />
						<div className="name">{name}</div>
						<div className="description">{description}</div>
						<div className="author">{author.name}</div>
					</div>
					<div className="blocks">
						{children.map((child: any, i: number) => {
							let cn = '';

							if (child.type == I.BlockType.Text) {
								n++;
								if (n == 2) n = 0;
								cn = n % 2 ? 'even' : 'odd';
							};

							return <Block key={child.id} className={cn} {...child} />;
						})}
					</div>
				</React.Fragment>
			);
		};
		
		return (
			<div className={cn.join(' ')}>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this.open();
	};
	
	open () {
		const { rootId } = this.props;

		this.setState({ loading: true });

		C.BlockOpen(rootId, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.setState({ loading: false });
		});
	};	

};

export default ObjectPreviewBlock;