import * as React from 'react';
import { ObjectName, ObjectDescription, IconObject, Loader } from 'Component';
import { dbStore } from 'Store';
import { translate, Util, ObjectUtil } from 'Lib';
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

		console.log(object);

		let typeObj = null;

		if (object) {
			const type = dbStore.getType(object.type);
			if (type) {
				typeObj = !type.isDeleted ? Util.shorten(type.name, 32) : <span className="textColor-red">{translate('commonDeletedType')}</span>;
			};
		};

		return (
			<div className={cn.join(' ')}>
				{loading ? <Loader /> : (
					<React.Fragment>
						<div className="previewHeader">
							<IconObject object={object} />
							<ObjectName object={object} />
						</div>
						<ObjectDescription object={object} />
						<div className="featured">{typeObj}</div>
					</React.Fragment>
				)}
			</div>
		);
	};

	componentDidMount (): void {
		this._isMounted = true;

		const { object } = this.props;
		if (!object) {
			this.load();
		};
	};

	componentDidUpdate (): void {
		const { position } = this.props;

		if (position) {
			position();
		};
	};

	componentWillUnmount(): void {
		this._isMounted = false;
	};

	load () {
		const { rootId, setObject } = this.props;
		const { loading } = this.state;

		if (loading || (this.id == rootId)) {
			return;
		};

		this.id = rootId;
		this.setState({ loading: true });

		ObjectUtil.getById(rootId, (object) => {
			if (!this._isMounted) {
				return;
			};

			this.setState({ object, loading: false });

			if (setObject) {
				setObject(object);
			};
		});
	};

});

export default PreviewDefault;