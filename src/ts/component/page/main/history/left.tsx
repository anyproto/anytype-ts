import * as React from 'react';
import { observer } from 'mobx-react';
import { Header, Block, HeadSimple } from 'Component';
import { I, M, S, U, translate } from 'Lib';

interface Props extends I.PageComponent {
	rootId: string;
	onCopy: () => void;
	getWrapperWidth: () => number;
};

const HistoryLeft = observer(class HistoryLeft extends React.Component<Props> {

	node = null;
	refHead = null;
	refHeader = null;
	top = 0;

	constructor (props: Props) {
		super(props);

		this.onScroll = this.onScroll.bind(this);
	};

	render () {
		const { rootId, onCopy } = this.props;
		const root = S.Block.getLeaf(rootId, rootId);
		const childrenIds = S.Block.getChildrenIds(rootId, rootId);
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, [ 'layoutAlign' ]);
		const icon = new M.Block({ id: `${rootId}-icon`, type: I.BlockType.IconPage, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const cover = new M.Block({ id: `${rootId}-cover`, type: I.BlockType.Cover, hAlign: object.layoutAlign, childrenIds: [], fields: {}, content: {} });
		const cn = [ 'editorWrapper', check.className ];
		const isSet = U.Object.isSetLayout(object.layout);
		const isCollection = U.Object.isCollectionLayout(object.layout);
		const isHuman = U.Object.isHumanLayout(object.layout);
		const isParticipant = U.Object.isParticipantLayout(object.layout);

		let head = null;
		let children = S.Block.getChildren(rootId, rootId);

		if (isSet || isCollection) {
			const placeholder = isCollection ? translate('defaultNameCollection') : translate('defaultNameSet');

			head = (
				<HeadSimple 
					{...this.props} 
					ref={ref => this.refHead = ref} 
					placeholder={placeholder} 
					rootId={rootId} 
					readonly={true}
				/>
			);

			children = children.filter(it => it.isDataview());
			check.withIcon = false;
		} else
		if (isHuman || isParticipant) {
			icon.type = I.BlockType.IconUser;
		};

		return (
			<div ref={ref => this.node = ref} id="historySideLeft" onScroll={this.onScroll}>
				<Header 
					{...this.props} 
					ref={ref => this.refHeader = ref}
					component="mainHistory" 
					rootId={rootId}
					layout={I.ObjectLayout.History}
				/>

				<div id="editorWrapper" className={cn.join(' ')}>
					<div className="editor">
						<div className="blocks">
							<div className="editorControls" />

							{head}
							{check.withCover ? <Block {...this.props} rootId={rootId} key={cover.id} block={cover} readonly={true} /> : ''}
							{check.withIcon ? <Block {...this.props} rootId={rootId} key={icon.id} block={icon} readonly={true} /> : ''}
							
							{children.map((block: I.Block, i: number) => (
								<Block 
									key={block.id} 
									{...this.props}
									rootId={rootId}
									index={i}
									block={block}
									readonly={true}
									onCopy={onCopy}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidUpdate () {
		S.Block.updateNumbers(this.props.rootId);
		$(this.node).scrollTop(this.top);
	};

	onScroll () {
		this.top = $(this.node).scrollTop();
		U.Common.getScrollContainer(this.props.isPopup).trigger('scroll');
	};

});

export default HistoryLeft;