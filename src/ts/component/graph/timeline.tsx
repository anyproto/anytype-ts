import React, { forwardRef, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import { DragHorizontal, Icon } from 'Component';

interface Props {
	id: string;
	graphRef: any;
	storageKey: string;
};

const SPEEDS = [ 1, 2, 4 ];
const DATE_THROTTLE = 300;
const PAD2: Intl.NumberFormatOptions = { minimumIntegerDigits: 2 };
const YEAR_FORMAT: Intl.NumberFormatOptions = { useGrouping: false };

const GraphTimeline = forwardRef<{}, Props>(({
	id = '',
	graphRef,
	storageKey = '',
}, ref) => {

	const nodeRef = useRef(null);
	const dragRef = useRef(null);
	const [ isPlaying, setIsPlaying ] = useState(false);
	const [ position, setPosition ] = useState(0);
	const [ cutoffDate, setCutoffDate ] = useState(0);
	const [ speed, setSpeed ] = useState(1);
	const [ dummy, setDummy ] = useState(0);
	const lastDateUpdate = useRef(0);
	const pendingDate = useRef(0);
	const settings = S.Common.getGraph(storageKey);

	const date = useMemo(() => {
		if (!cutoffDate) {
			return null;
		};

		const d = new Date(cutoffDate * 1000);
		return {
			month: d.getMonth() + 1,
			day: d.getDate(),
			year: d.getFullYear(),
		};
	}, [ cutoffDate ]);

	const onPlay = useCallback(() => {
		if (isPlaying) {
			graphRef.current?.timelinePause();
			setIsPlaying(false);
			setCutoffDate(pendingDate.current);
		} else {
			graphRef.current?.timelineStart(speed);
			setIsPlaying(true);
		};
	}, [ isPlaying, speed ]);

	const onSpeedChange = useCallback(() => {
		const idx = SPEEDS.indexOf(speed);
		const next = SPEEDS[(idx + 1) % SPEEDS.length];

		setSpeed(next);

		if (isPlaying) {
			graphRef.current?.timelineStart(next);
		};
	}, [ isPlaying, speed ]);

	const onSeekMove = useCallback((e: any, v: number) => {
		graphRef.current?.timelineSeek(v);
	}, []);

	const onSeekEnd = useCallback((e: any, v: number) => {
		graphRef.current?.timelineSeek(v);
	}, []);

	useEffect(() => {
		const onTimelineUpdate = (e: any) => {
			const data = e.detail;
			setPosition(data.position);
			setIsPlaying(data.isPlaying);
			dragRef.current?.setValue(data.position);

			pendingDate.current = data.cutoffDate;

			const now = performance.now();
			if (!data.isPlaying || (now - lastDateUpdate.current >= DATE_THROTTLE)) {
				setCutoffDate(data.cutoffDate);
				lastDateUpdate.current = now;
			};
		};

		const onTimelineComplete = () => {
			setIsPlaying(false);
			setCutoffDate(pendingDate.current);
		};

		const onSettingsUpdate = () => {
			setDummy(v => v + 1);
		};

		U.Dom.addEvents(window, [
			[`timelineUpdate.${id}`, onTimelineUpdate],
			[`timelineComplete.${id}`, onTimelineComplete],
			['updateGraphSettings', onSettingsUpdate],
		]);

		return () => {
			U.Dom.removeEvents(window, [
				[`timelineUpdate.${id}`, onTimelineUpdate],
				[`timelineComplete.${id}`, onTimelineComplete],
				['updateGraphSettings', onSettingsUpdate],
			]);
			graphRef.current?.timelineReset();
		};
	}, []);

	if (!settings.timeline) {
		return null;
	};

	return (
		<div ref={nodeRef} className="graphTimeline">
			<div className="controls">
				<Icon
					name={isPlaying ? 'control/audio/pause' : 'control/audio/play'}
					color="default"
					onMouseDown={onPlay}
					onClick={e => e.stopPropagation()}
				/>

				<div
					className="speed"
					onClick={onSpeedChange}
				>
					{speed}x
				</div>

				<div className="dragWrapper">
					<DragHorizontal
						ref={dragRef}
						value={position}
						onMove={onSeekMove}
						onEnd={onSeekEnd}
					/>
				</div>

				<div className="dateLabel">
					{date ? (
						<NumberFlowGroup>
							<NumberFlow value={date.month} format={PAD2} willChange animated />
							<span className="separator">/</span>
							<NumberFlow value={date.day} format={PAD2} willChange animated />
							<span className="separator">/</span>
							<NumberFlow value={date.year} format={YEAR_FORMAT} willChange animated />
						</NumberFlowGroup>
					) : null}
				</div>
			</div>
		</div>
	);

});

export default GraphTimeline;
