import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Loader } from 'ts/component';
import { C, Util } from 'ts/lib';
import { observer } from 'mobx-react';

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
const ALLOWED_SCHEME = [ 'http', 'https' ];

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
		
		return (
			<div className="previewLink">
				{loading ? <Loader /> : (
					<React.Fragment>
						{imageUrl ? <div className="img" style={{ backgroundImage: `url("${imageUrl}")` }} /> : ''}
						<div className="info">
							{title ? <div className="name">{title}</div> : ''}
							{description ? <div className="descr">{description}</div> : ''}
							<div className="link">
								{faviconUrl ? <Icon icon={faviconUrl} className="fav" /> : ''}
								{url}
							</div> 
						</div>
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this.load();
	};

	componentDidUpdate () {
		const { position } = this.props;
		const { imageUrl } = this.state;
		const node = $(ReactDOM.findDOMNode(this));

		imageUrl ? node.addClass('withImage') : node.removeClass('withImage');

		this.load();

		if (position) {
			position();
		};
	};

	load () {
		const { url } = this.props;
		if (this.url == url) {
			return;
		};
		
		this.url = url;
		this.setState({ loading: true });

		const scheme = Util.getScheme(url);
		if (scheme && !ALLOWED_SCHEME.includes(scheme)) {
			return;
		};

		C.LinkPreview(url, (message: any) => {
			if (message.error.code) {
				this.url = '';
				this.setState({ loading: false });
				return;
			};

			this.setState({ ...message.previewLink, loading: false });
		});
	};

});

export default PreviewLink;