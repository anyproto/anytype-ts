import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Smile } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';


interface Props extends I.Popup {
	history: any;
};

@observer
class PopupArchive extends React.Component<Props, {}> {

	render () {
		const { blocks, archive } = blockStore;
		const tree = blockStore.prepareTree(archive, blocks[archive] || []);
		
		const Item = (item: any) => {
			let content = item.content || {};
			let fields = content.fields || {}; 
			return (
				<div className="item">
					<Smile icon={fields.icon} />
					<div className="name">{fields.name}</div>
					<div className="buttons">
						<div className="btn" onClick={(e: any) => { this.onReturn(item); }}>Put back</div>
						<div className="btn" onClick={(e: any) => { this.onDelete(item); }}>Delete</div>
					</div>
				</div>
			);
		};
		
		return (
			<div>
				<Title text="Archive" />
				<div className="items">
					{tree.map((item: any, i: any) => (
						<Item key={item.id} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { archive } = blockStore;
		C.BlockOpen(archive, [], (message: any) => {});
	};
	
	componentWillUnmount () {
		const { archive } = blockStore;
		C.BlockClose(archive, [], (message: any) => {});
	};
	
	onReturn (item: any) {
		const { archive } = blockStore;
		C.BlockSetPageIsArchived(archive, item.content.targetBlockId, false, (message: any) => {});
	};
	
	onDelete (item: any) {
		const { archive } = blockStore;
		C.BlockUnlink(archive, [ item.id ], (message: any) => {});
	};
	
};

export default PopupArchive;