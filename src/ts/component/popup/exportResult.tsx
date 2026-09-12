import React, { forwardRef, useEffect, useState } from 'react';
import { Title, Label, Button, IconObject, ObjectName, ObjectType } from 'Component';
import * as I from 'Interface';
import { ExportReport_Issue_Severity } from 'Proto/pkg/lib/pb/model/protos/export_report';
import { ExportResultData, getExportResultStatus, getExportIssueMessageKey } from 'Lib/util/exportReport';
import { loadExportReportObjects } from 'Lib/util/exportReportObjects';

const PAGE_SIZE = 50;

const PopupExportResult = forwardRef<{}, I.Popup>((props, ref) => {
	const { param, close, position } = props;
	const { report, error, path, spaceId, exportType } = param.data as ExportResultData;
	const status = getExportResultStatus(report, error?.code);
	const allIssues = report?.issues || [];
	const errors = allIssues.filter(it => it.severity == ExportReport_Issue_Severity.ERROR);
	const warnings = allIssues.filter(it => ![ ExportReport_Issue_Severity.ERROR, ExportReport_Issue_Severity.INFO ].includes(it.severity));
	const notes = allIssues.filter(it => it.severity == ExportReport_Issue_Severity.INFO);
	const [ visibleCount, setVisibleCount ] = useState(PAGE_SIZE);
	const [ warningVisibleCount, setWarningVisibleCount ] = useState(PAGE_SIZE);
	const [ warningsOpen, setWarningsOpen ] = useState(false);
	const [ notesOpen, setNotesOpen ] = useState(false);
	const [ objects, setObjects ] = useState<Record<string, any>>({});
	const [ copied, setCopied ] = useState(false);
	const canOpenFolder = path && [ 'Success', 'Partial' ].includes(status);

	useEffect(() => {
		setVisibleCount(PAGE_SIZE);
		setWarningVisibleCount(PAGE_SIZE);
		setWarningsOpen(false);
		setNotesOpen(false);
		setCopied(false);
	}, [ report, error, path ]);

	useEffect(() => {
		setObjects({});
		return loadExportReportObjects(spaceId, report, setObjects);
	}, [ report, spaceId ]);

	useEffect(() => {
		position?.();
	}, [ report, error, objects, visibleCount, warningVisibleCount ]);

	const onCopy = () => {
		const text = JSON.stringify({ exportType, spaceId, status, path, error, report }, null, 2);
		U.Common.clipboardCopy({ text }, () => setCopied(true));
	};

	const renderIssues = (items: typeof allIssues, count: number, onShowMore: () => void) => (
		<>
			<div className="issues customScrollbar">
				{items.slice(0, count).map((issue, index) => {
					const messageKey = getExportIssueMessageKey(issue);
					const isError = issue.severity == ExportReport_Issue_Severity.ERROR;
					const object = objects[issue.objectId];
					const type = object ? objects[object.type] : null;
					return (
						<div className="issue" key={index}>
							{issue.objectId ? (
								<div className="issueObject">
									<IconObject object={object || { id: issue.objectId }} size={32} noClick={true} />
									<div className="objectDetails">
										{object ? <ObjectName object={object} /> : <span>{translate('popupExportResultObjectUnavailable')}</span>}
										{type ? <div className="type"><ObjectType object={type} /></div> : ''}
									</div>
								</div>
							) : ''}
							<div className="issueHeading">
								<span className={`severity ${isError ? 'error' : 'warning'}`}>{translate(isError ? 'commonError' : 'commonWarning')}</span>
							</div>
							<div className="message">{messageKey ? translate(messageKey) : (issue.message || translate('popupExportResultUnknownIssue'))}</div>
							{!messageKey && issue.path ? <div className="issuePath">{issue.path}</div> : ''}
							{issue.code || issue.objectId || messageKey ? (
								<details>
									<summary>{translate('popupExportResultTechnicalDetails')}</summary>
									{messageKey && issue.message ? <div className="message">{issue.message}</div> : ''}
									{messageKey && issue.path ? <div className="issuePath">{issue.path}</div> : ''}
									{issue.code ? <div>{translate('popupExportResultCode')}: <code>{issue.code}</code></div> : ''}
									{issue.objectId ? <div>{translate('popupExportResultObjectId')}: <code>{issue.objectId}</code></div> : ''}
								</details>
							) : ''}
						</div>
					);
				})}
			</div>
			{count < items.length ? (
				<Button className="showMore" color="blank" size={28} text={translate('popupExportResultShowMore')} onClick={onShowMore} />
			) : ''}
		</>
	);

	return (
		<div className={`exportResult status${status}`}>
			<Title text={translate(`popupExportResultTitle${status}`)} />
			<Label className="description" text={translate(`popupExportResultText${status}`)} />

			{report ? (
				<div className="summary">
					{[
						{ id: 'Exported', count: report.succeed },
						{ id: 'ObjectErrors', count: report.objectErrors },
						{ id: 'FileErrors', count: report.fileErrors },
					].map(item => (
						<div key={item.id} className="stat">
							<div className="count">{item.count || 0}</div>
							<Label text={translate(`popupExportResult${item.id}`)} />
						</div>
					))}
				</div>
			) : ''}

			{errors.length ? (
				<>
					<div className="issuesHeader">
						<Label text={translate('popupExportResultErrors')} />
						<span>{errors.length}</span>
					</div>
					{renderIssues(errors, visibleCount, () => setVisibleCount(visibleCount + PAGE_SIZE))}
				</>
			) : ''}

			{warnings.length ? (
				<details className="issueGroup warningGroup" open={warningsOpen} onToggle={e => {
					setWarningsOpen(e.currentTarget.open);
					position?.();
				}}>
					<summary>
						<span>{translate('popupExportResultWarnings')}</span>
						<span className="count">{warnings.length}</span>
					</summary>
					{renderIssues(warnings, warningVisibleCount, () => setWarningVisibleCount(warningVisibleCount + PAGE_SIZE))}
				</details>
			) : ''}

			{notes.length ? (
				<details className="issueGroup notesGroup" open={notesOpen} onToggle={e => {
					setNotesOpen(e.currentTarget.open);
					position?.();
				}}>
					<summary>
						<span>{translate('popupExportResultInformation')}</span>
						<span className="count">{notes.length}</span>
					</summary>
					<div className="issues customScrollbar">
						{notes.map((note, index) => <div className="issue" key={index}><div className="message">{note.message}</div></div>)}
					</div>
				</details>
			) : ''}

			{error?.description && !allIssues.some(it => it.message == error.description) ? (
				<details>
					<summary>{translate('popupExportResultTechnicalDetails')}</summary>
					<div className="errorMessage">{error.description}</div>
				</details>
			) : ''}

			<div className="buttons">
				<Button text={translate(copied ? 'popupExportResultCopied' : 'popupExportResultCopyReport')} color="blank" size={36} onClick={onCopy} />
				<div className="actions">
					{canOpenFolder ? <Button text={translate('popupExportResultOpenFolder')} size={36} onClick={() => Action.openPath(path)} /> : ''}
					<Button text={translate('commonDone')} color={canOpenFolder ? 'blank' : 'black'} size={36} onClick={() => close()} />
				</div>
			</div>
		</div>
	);
});

export default PopupExportResult;
