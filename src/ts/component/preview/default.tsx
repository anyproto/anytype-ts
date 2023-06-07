import * as React from 'react';
import { ObjectName, ObjectDescription, IconObject, Loader } from 'Component';
import { dbStore } from 'Store';
import { translate, UtilCommon, UtilObject } from 'Lib';
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

		let typeObj = null;
		if (object) {
			const type = dbStore.getType(object.type);
			if (type) {
				typeObj = !type.isDeleted ? UtilCommon.shorten(type.name, 32) : <span className="textColor-red">{translate('commonDeletedType')}</span>;
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
		this.init();
	};

	componentDidUpdate (): void {
		const { position } = this.props;

		this.init();

		if (position) {
			position();
		};
	};

	init () {
		const { object } = this.props;

		if (!object) {
			this.load();
		};
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