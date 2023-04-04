import * as React from 'react';
import { Loader, PreviewDefault } from 'Component';
import { detailStore, blockStore } from 'Store';
import { C, DataUtil, Action } from 'Lib';
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

const PreviewObject = observer(class PreviewObject extends React.Component<Props, State> {
	
	state = {
		loading: false,
	};
	isOpen = false;
	_isMounted = false;
	id = '';

	public static defaultProps = {
		className: '',
	};
	
	render () {
		const { loading } = this.state;
		const { rootId, className, onClick } = this.props;
		const contextId = this.getRootId();
		const check = DataUtil.checkDetails(contextId, rootId);
		const object = check.object;
		const cn = [ 'previewObject' , check.className, className ];

		return (
			<div className={cn.join(' ')} onClick={onClick}>
				{loading ? <Loader /> : <PreviewDefault object={object} />}
				<div className="border" />
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
		const { rootId, setObject } = this.props;
		const contextId = this.getRootId();

		if (!this._isMounted || loading || (this.id == rootId)) {
			return;
		};

		this.id = rootId;
		this.setState({ loading: true });

		C.ObjectShow(rootId, 'preview', () => {
			if (!this._isMounted) {
				return;
			};

			this.setState({ loading: false });

			if (setObject) {
				setObject(detailStore.get(contextId, rootId, []));
			};
		});
	};

	getRootId () {
		const { rootId } = this.props;
		return [ rootId, 'preview' ].join('-');
	};

});

export default PreviewObject;