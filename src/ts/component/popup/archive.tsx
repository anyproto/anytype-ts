import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Smile, Loader } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';


interface Props extends I.Popup {
	history: any;
};

interface State {
	loading: boolean;
};

@observer
class PopupArchive extends React.Component<Props, State> {

	state = {
		loading: false,
	};

	render () {
		const { loading } = this.state;
		
		if (loading) {
			return <Loader />;
		};
		
		const { archive } = blockStore;
		const map = blockStore.structureGet(archive);
		const element = map[archive] || {};
		
		if (!element) {
			return null;
		};
		
		const { childrenIds } = element;
		const children = blockStore.getChildren(archive, archive);
		
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
					{children.map((item: any, i: any) => (
						<Item key={item.id} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { archive } = blockStore;
		
		this.setState({ loading: true });
		C.BlockOpen(archive, [], (message: any) => {
			this.setState({ loading: false });
		});
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