import * as React from 'react';
import { IconObject, Loader } from 'Component';
import { I, C, ObjectUtil, Action } from 'Lib';
import { menuStore, detailStore } from 'Store';
import { observer } from 'mobx-react';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const BlockIconUser = observer(class BlockIconUser extends React.Component<I.BlockComponent, State> {

	state = {
		loading: false
	};

	constructor (props: I.BlockComponent) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render (): any {
		const { loading } = this.state;
		const { rootId, readonly } = this.props;

		return (
			<div className="wrap">
				{loading ? <Loader /> : ''}
				<IconObject
					getObject={() => detailStore.get(rootId, rootId, [])}
					className={readonly ? 'isReadonly' : ''}
					onClick={this.onClick}
					size={128}
				/>
			</div>
		);
	};
	
	onClick (e: any) {
		const { rootId, readonly } = this.props;

		if (readonly) {
			return;
		};

		const object = detailStore.get(rootId, rootId, []);
		const options = [
			{ id: 'upload', name: 'Change' },
		];

		if (object.iconImage) {
			options.push({ id: 'remove', name: 'Remove' });
		};
		
		menuStore.open('select', { 
			element: `#block-${rootId}-icon .iconObject`,
			horizontal: I.MenuDirection.Center,
			data: {
				value: '',
				options: options,
				onSelect: (event: any, item: any) => {
					if (item.id == 'remove') {
						ObjectUtil.setIcon(rootId, '', '');
					};
					if (item.id == 'upload') {
						this.onUpload();
					};
				},
			}
		});
	};
	
	onUpload () {
		const { rootId } = this.props;

		Action.openFile(Constant.extension.cover, paths => {
			this.setState({ loading: true });

			C.FileUpload('', paths[0], I.FileType.Image, (message: any) => {
				if (!message.error.code) {
					ObjectUtil.setIcon(rootId, '', message.hash, () => {
						this.setState({ loading: false });
					});
				};
			});
		});
	};
	
});

export default BlockIconUser;