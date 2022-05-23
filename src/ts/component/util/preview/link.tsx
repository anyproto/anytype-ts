import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Loader } from 'ts/component';
import { observer } from 'mobx-react';
import { C } from 'ts/lib';

interface Props {
	url: string;
	position?: () => void;
};

interface State {
	loading: boolean;
	title: string;
	description: string;
	param: string;
	faviconUrl: string;
	imageUrl: string;
};

const $ = require('jquery');

const PreviewLink = observer(class PreviewLink extends React.Component<Props, State> {
	
	state = {
		loading: false,
		title: '',
		description: '',
		param: '',
		faviconUrl: '',
		imageUrl: '',
	};
	url: string;
	
	render () {
		const { url } = this.props;
		const { loading, title, description, param, faviconUrl, imageUrl } = this.state;
		
		if (loading) {
			return <Loader />;
		};
		
		return (
			<div className="previewLink">
				{imageUrl ? <div className="img" style={{ backgroundImage: `url("${imageUrl}")` }} /> : ''}
				<div className="info">
					{title ? <div className="name">{title}</div> : ''}
					{description ? <div className="descr">{description}</div> : ''}
					<div className="link">
						{faviconUrl ? <Icon icon={faviconUrl} className="fav" /> : ''}
						{url}
					</div> 
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.load();
	};

	componentDidUpdate () {
		const { imageUrl } = this.state;
		const node = $(ReactDOM.findDOMNode(this));

		imageUrl ? node.addClass('withImage') : node.removeClass('withImage');

		this.load();
	};

	load () {
		const { url } = this.props;
		if (this.url == url) {
			return;
		};
		
		this.url = url;
		this.setState({ loading: true });

		const scheme = this.getScheme();
		if (scheme && ![ 'http', 'https' ].includes(scheme)) {
			return;
		};
		
		C.LinkPreview(url, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			this.setState({ ...message.previewLink, loading: false });

			if (this.props.position) {
				this.props.position();
			};
		});
	};

	getScheme () {
		const a = String(this.props.url || '').split('://');
		return String(a[0] || '');
	};
	
});

export default PreviewLink;