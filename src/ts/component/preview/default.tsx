import * as React from 'react';
import { ObjectName, ObjectDescription, ObjectType, IconObject, Loader } from 'Component';
import { dbStore } from 'Store';
import { UtilObject } from 'Lib';
import { observer } from 'mobx-react';

interface Props {
	rootId?: string;
	object?: any;
	className?: string;
	position?: () => void;
	setObject?: (object: any) => void;
};

interface State {
	object: any;
	loading: boolean;
};

const PreviewDefault = observer(class PreviewDefault extends React.Component<Props, State> {
	
	public static defaultProps = {
		className: '',
	};

	_isMounted = false;
	state = {
		object: null,
		loading: false,
	};
	id = '';

	render () {
		const { className } = this.props;
		const { loading } = this.state;
		const cn = [ 'previewDefault', className ];
		const object = this.props.object || this.state.object || {};
		const type = dbStore.getTypeById(object.type);

		return (
			<div className={cn.join(' ')}>
				{loading ? <Loader /> : (
					<React.Fragment>
						<div className="previewHeader">
							<IconObject object={object} />
							<ObjectName object={object} />
						</div>
						<ObjectDescription object={object} />
						<div className="featured">
							<ObjectType object={type} />
						</div>
					</React.Fragment>
				)}
			</div>
		);
	};

	componentDidMount (): void {
		this._isMounted = true;
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		const { position } = this.props;
		const object = this.props.object || this.state.object;

		object ? position && position() : this.load();
	};

	componentWillUnmount(): void {
		this._isMounted = false;
		this.id = '';
	};

	load () {
		const { rootId, setObject } = this.props;
		const { loading } = this.state;

		if (loading || (this.id == rootId)) {
			return;
		};

		this.id = rootId;
		this.setState({ loading: true });

		UtilObject.getById(rootId, (object) => {
			if (!this._isMounted) {
				return;
			};

			this.state.object = object;
			this.setState({ object, loading: false });

			if (setObject) {
				setObject(object);
			};
		});
	};

});

export default PreviewDefault;