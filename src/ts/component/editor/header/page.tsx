import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, M, DataUtil } from 'ts/lib';
import { Block, IconObject } from 'ts/component';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	dataset?: any;
	rootId: string;
	readOnly: boolean;
	onKeyDown?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
	onKeyUp?(e: any, text: string, marks: I.Mark[], range: I.TextRange): void;
	onMenuAdd? (id: string, text: string, range: I.TextRange, useRect: boolean): void;
	onPaste? (e: any): void;
};

@observer
class EditorHeaderPage extends React.Component<Props, {}> {
	
	render (): any {
		const { rootId, onKeyDown, onKeyUp, onMenuAdd, onPaste } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const { config } = commonStore;

		if (!root) {
			return null;
		};

		const check = DataUtil.checkDetails(rootId);
		const header = blockStore.getLeaf(rootId, 'header') || {};
		const title = blockStore.getLeaf(rootId, 'title') || {};
		const cover = new M.Block({ id: rootId + '-cover', type: I.BlockType.Cover, align: title.align, childrenIds: [], fields: {}, content: {} });
		const icon: any = new M.Block({ id: rootId + '-icon', type: I.BlockType.IconPage, align: title.align, childrenIds: [], fields: {}, content: {} });

		if (root.isObjectHuman()) {
			icon.type = I.BlockType.IconUser;
		};

		const objectType = dbStore.getObjectType(check.object.type);
		const creator = blockStore.getDetails(rootId, check.object.creator);
		const featured = [];

		if (objectType) {
			featured.push({ ...objectType, layout: I.ObjectLayout.ObjectType });
		};
		if (!creator._detailsEmpty_) {
			featured.push(creator);
		};

		const Element = (item: any) => (
			<div className="element">
				<IconObject size={24} object={item} />
				{item.name}
			</div>
		);

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

				{config.allowDataview ? (
					<div className={[ 'block', 'blockFeatured', 'align' + title.align ].join(' ')}>
						<div className="wrapMenu" />
						<div className="wrapContent">
							{featured.map((item: any, i: any) => (
								<span key={i}>
									{i > 0 ? <div className="bullet" /> : ''}
									<Element {...item} />
								</span>
							))}
						</div>
					</div>
				) : ''}
			</div>
		);
	};
	
};

export default EditorHeaderPage;