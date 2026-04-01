import React, { Component, ReactNode } from 'react';
import { Frame, Button, Label, Icon } from 'Component';

interface Props {
	children: ReactNode;
};

interface State {
	hasError: boolean;
	error: Error | null;
};

class ErrorBoundary extends Component<Props, State> {

	state: State = {
		hasError: false,
		error: null,
	};

	static getDerivedStateFromError (error: Error): State {
		return { hasError: true, error };
	};

	componentDidCatch (error: Error, info: React.ErrorInfo) {
		console.error('ErrorBoundary caught:', error, info);
	};

	onCopy = () => {
		const { error } = this.state;

		if (error) {
			const text = `${error.message}\n\n${error.stack || ''}`.trim();
			U.Common.copyToast(translate('commonError'), text);
		};
	};

	onReload = () => {
		window.location.reload();
	};

	render () {
		const { hasError, error } = this.state;

		if (!hasError || !error) {
			return this.props.children;
		};

		return (
			<Frame className="errorBoundary">
				<Icon name="common/alert" color="red" className="errorBoundaryIcon" size={56} />
				<Label className="title" text={translate('errorBoundaryTitle')} />
				<Label className="description" text={translate('errorBoundaryDescription')} />

				<div className="errorDetails" onClick={this.onCopy}>
					<div className="message">{error.message}</div>
					{error.stack ? <div className="stack">{error.stack}</div> : ''}
				</div>

				<div className="buttons">
					<Button text={translate('commonCopy')} size={28} color="blank" onClick={this.onCopy} />
					<Button text={translate('errorBoundaryReload')} size={28} color="black" onClick={this.onReload} />
				</div>
			</Frame>
		);
	};

};

export default ErrorBoundary;
