import { ExportReport, ExportReport_Status, ExportReport_Issue, ExportReport_Issue_Severity } from 'Proto/pkg/lib/pb/model/protos/export_report';

export interface ExportResultData {
	report?: ExportReport;
	error?: { code: number; description?: string };
	path?: string;
	spaceId?: string;
	exportType?: number;
};

export type ExportResultStatus = 'Success' | 'Partial' | 'Failed' | 'Canceled';

export const getExportResultStatus = (report?: Partial<ExportReport>, errorCode = 0): ExportResultStatus => {
	if (report?.status == ExportReport_Status.CANCELED) {
		return 'Canceled';
	};
	if (errorCode || (report?.status == ExportReport_Status.FAILED)) {
		return 'Failed';
	};
	if (report && (
		(report.objectErrors > 0) || (report.fileErrors > 0) || report.issues?.some(it => it.severity == ExportReport_Issue_Severity.ERROR)
	)) {
		return 'Partial';
	};
	return 'Success';
};

// Stable server codes select translated copy; diagnostics stay in the report.
export const getExportIssueMessageKey = (issue: Pick<ExportReport_Issue, 'code'>): string => {
	switch (issue.code) {
		case 'type_identity_mismatch': return 'popupExportResultTypeIdentityMismatch';
		case 'unresolved_target': return 'popupExportResultUnresolvedTarget';
		case 'export_failed': return 'popupExportResultExportFailed';
		default: return '';
	};
};
