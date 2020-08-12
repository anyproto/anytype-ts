import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { HeaderMainHistory as Header, FooterMainEdit as Footer, Block } from 'ts/component';
import { blockStore } from 'ts/store';
import { I, M } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};

class PageMainHistory extends React.Component<Props, {}> {
	
	refHeader: any = null;

	constructor (props: any) {
		super(props);
	};

	render () {
		const { history, location, match } = this.props;
		const rootId = match.params.id;
		const root = blockStore.getLeaf(rootId, rootId);
		
		if (!root) {
			return null;
		};

		const childrenIds = blockStore.getChildrenIds(rootId, rootId);
		const children = blockStore.getChildren(rootId, rootId);
		const details = blockStore.getDetails(rootId, rootId);
		const length = childrenIds.length;

		const withIcon = details.iconEmoji || details.iconImage;
		const withCover = (details.coverType != I.CoverType.None) && details.coverId;
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, childrenIds: [], fields: {}, content: {} });
		
		let cn = [ 'editorWrapper' ];
		let icon: any = { id: rootId + '-icon', childrenIds: [], fields: {}, content: {} };
		
		if (root.isPageProfile()) {
			cn.push('isProfile');
			icon.type = I.BlockType.IconUser;
		} else {
			icon.type = I.BlockType.IconPage;
		};

		if (root.isPageSet()) {
			cn.push('isDataview');
		};
		
		icon = new M.Block(icon);
		
		if (withIcon && withCover) {
			cn.push('withIconAndCover');
		} else
		if (withIcon) {
			cn.push('withIcon');
		} else
		if (withCover) {
			cn.push('withCover');
		};
		
		return (
			<div>
				<Header ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />
				<div className="wrapper">
					<div className={cn.join(' ')}>
						<div className="editor">
							<div className="blocks">
								{withIcon ? (
									<Block 
										key={icon.id} 
										{...this.props} 
										rootId={rootId}
										block={icon} 
										className="root" 
										readOnly={true}
									/>	
								) : ''}
								
								{children.map((block: I.Block, i: number) => {
									return (
										<Block 
											key={block.id} 
											{...this.props}
											rootId={rootId}
											index={i}
											block={block}
											onKeyDown={() => {}}
											onKeyUp={() => {}} 
											onMenuAdd={() => {}}
											onPaste={() => {}}
											readOnly={true}
										/>
									)
								})}
							</div>
						</div>
					</div>
				</div>
				<Footer {...this.props} rootId={rootId} />
			</div>
		);
	};
	
	componentDidMount () {
	};
	
	componentDidUpdate () {
	};
	
};

export default PageMainHistory;