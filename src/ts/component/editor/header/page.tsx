import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, M, DataUtil } from 'ts/lib';
import { Block } from 'ts/component';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
	readOnly: boolean;
	onKeyDown?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
	onKeyUp?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
	onMenuAdd? (id: string, text: string, range: I.TextRange): void;
	onPaste? (e: any): void;
};

@observer
class EditorHeaderPage extends React.Component<Props, {}> {
	
	render (): any {
		const { rootId, onKeyDown, onKeyUp, onMenuAdd, onPaste } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const check = DataUtil.checkDetails(rootId);
		const header = blockStore.getLeaf(rootId, 'header') || {};
		const title = blockStore.getLeaf(rootId, 'title') || {};
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, align: title.align, childrenIds: [], fields: {}, content: {} });
		const icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, align: title.align, childrenIds: [], fields: {}, content: {} });

		if (root.isObjectContact()) {
			icon.type = I.BlockType.IconUser;
		};

		return (
			<div>
				{check.withCover ? <Block {...this.props} key={cover.id} block={cover} /> : ''}
				{check.withIcon ? <Block {...this.props} key={icon.id} block={icon} /> : ''}
				<Block 
					key={header.id} 
					{...this.props}
					index={0}
					block={header}
					onKeyDown={onKeyDown}
					onKeyUp={onKeyUp}  
					onMenuAdd={onMenuAdd}
					onPaste={onPaste}
				/>
			</div>
		);
	};
	
};

export default EditorHeaderPage;