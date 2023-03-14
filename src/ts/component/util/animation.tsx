import * as React from 'react';
import $ from 'jquery';

class AnimationCanvas extends React.Component {
	
	_isMounted = false;
	node = null;
	worker = null;
	
	render () {
		return (
			<div
				ref={node => this.node = node}
				className="animationCanvas"
			>
				<canvas id="canvas"></canvas>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.init();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	unbind () {
		$(window).off('resize.animation');
	};

	rebind () {
		this.unbind();

		$(window).on('resize.animation', () => this.resize());
	};

	init () {
		const node = $(this.node);
		const width = node.width();
		const height = node.height();
		const density = window.devicePixelRatio;
		const canvas = node.find('#canvas');
		const transfer = (canvas.get(0) as HTMLCanvasElement).transferControlToOffscreen();

		this.worker = new Worker('workers/animation.js', { type: 'module' });
		this.worker.onerror = (e: any) => { console.log(e); };
		this.worker.addEventListener('message', this.onMessage);

		this.send('init', { canvas: transfer, width, height, density }, [ transfer ]);
		this.resize();
	};

	send (id: string, param: any, transfer?: any[]) {
		if (this.worker) {
			this.worker.postMessage({ id: id, ...param }, transfer);
		};
	};

	onMessage (e) {
		const { id, data } = e.data;
		const node = $(this.node);

		switch (id) {
		};
	};

	resize () {
		const node = $(this.node);
		const width = node.width();
		const height = node.height();
		const density = window.devicePixelRatio;

		this.send('resize', { width, height, density });
	};
	
};

export default AnimationCanvas;