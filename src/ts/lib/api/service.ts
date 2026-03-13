/**
 * Custom gRPC-web service client using ts-proto MessageFns for serialization.
 * Replaces the generated service_grpc_web_pb.js which depends on old CJS protobuf files.
 *
 * Auto-generated registry: 316 unary methods.
 */

import { GrpcWebClientBase, MethodDescriptor, MethodType } from 'grpc-web';
import type { ClientReadableStream } from 'grpc-web';
import type { MessageFns } from 'Proto/google/protobuf/struct';
import * as Commands from 'Proto/pb/protos/commands';
import * as Events from 'Proto/pb/protos/events';

interface RegistryEntry {
	req: MessageFns<any>;
	res: MessageFns<any>;
}

const registry: Record<string, RegistryEntry> = {
	AIAutofill: { req: Commands.Rpc_AI_Autofill_Request, res: Commands.Rpc_AI_Autofill_Response },
	AIListSummary: { req: Commands.Rpc_AI_ListSummary_Request, res: Commands.Rpc_AI_ListSummary_Response },
	AIObjectCreateFromUrl: { req: Commands.Rpc_AI_ObjectCreateFromUrl_Request, res: Commands.Rpc_AI_ObjectCreateFromUrl_Response },
	AIWritingTools: { req: Commands.Rpc_AI_WritingTools_Request, res: Commands.Rpc_AI_WritingTools_Response },
	AccountChangeJsonApiAddr: { req: Commands.Rpc_Account_ChangeJsonApiAddr_Request, res: Commands.Rpc_Account_ChangeJsonApiAddr_Response },
	AccountChangeNetworkConfigAndRestart: { req: Commands.Rpc_Account_ChangeNetworkConfigAndRestart_Request, res: Commands.Rpc_Account_ChangeNetworkConfigAndRestart_Response },
	AccountConfigUpdate: { req: Commands.Rpc_Account_ConfigUpdate_Request, res: Commands.Rpc_Account_ConfigUpdate_Response },
	AccountCreate: { req: Commands.Rpc_Account_Create_Request, res: Commands.Rpc_Account_Create_Response },
	AccountDelete: { req: Commands.Rpc_Account_Delete_Request, res: Commands.Rpc_Account_Delete_Response },
	AccountEnableLocalNetworkSync: { req: Commands.Rpc_Account_EnableLocalNetworkSync_Request, res: Commands.Rpc_Account_EnableLocalNetworkSync_Response },
	AccountLocalLinkCreateApp: { req: Commands.Rpc_Account_LocalLink_CreateApp_Request, res: Commands.Rpc_Account_LocalLink_CreateApp_Response },
	AccountLocalLinkListApps: { req: Commands.Rpc_Account_LocalLink_ListApps_Request, res: Commands.Rpc_Account_LocalLink_ListApps_Response },
	AccountLocalLinkNewChallenge: { req: Commands.Rpc_Account_LocalLink_NewChallenge_Request, res: Commands.Rpc_Account_LocalLink_NewChallenge_Response },
	AccountLocalLinkRevokeApp: { req: Commands.Rpc_Account_LocalLink_RevokeApp_Request, res: Commands.Rpc_Account_LocalLink_RevokeApp_Response },
	AccountLocalLinkSolveChallenge: { req: Commands.Rpc_Account_LocalLink_SolveChallenge_Request, res: Commands.Rpc_Account_LocalLink_SolveChallenge_Response },
	AccountMigrate: { req: Commands.Rpc_Account_Migrate_Request, res: Commands.Rpc_Account_Migrate_Response },
	AccountMigrateCancel: { req: Commands.Rpc_Account_MigrateCancel_Request, res: Commands.Rpc_Account_MigrateCancel_Response },
	AccountMove: { req: Commands.Rpc_Account_Move_Request, res: Commands.Rpc_Account_Move_Response },
	AccountRecover: { req: Commands.Rpc_Account_Recover_Request, res: Commands.Rpc_Account_Recover_Response },
	AccountRecoverFromLegacyExport: { req: Commands.Rpc_Account_RecoverFromLegacyExport_Request, res: Commands.Rpc_Account_RecoverFromLegacyExport_Response },
	AccountRevertDeletion: { req: Commands.Rpc_Account_RevertDeletion_Request, res: Commands.Rpc_Account_RevertDeletion_Response },
	AccountSelect: { req: Commands.Rpc_Account_Select_Request, res: Commands.Rpc_Account_Select_Response },
	AccountStop: { req: Commands.Rpc_Account_Stop_Request, res: Commands.Rpc_Account_Stop_Response },
	AppGetVersion: { req: Commands.Rpc_App_GetVersion_Request, res: Commands.Rpc_App_GetVersion_Response },
	AppSetDeviceState: { req: Commands.Rpc_App_SetDeviceState_Request, res: Commands.Rpc_App_SetDeviceState_Response },
	AppShutdown: { req: Commands.Rpc_App_Shutdown_Request, res: Commands.Rpc_App_Shutdown_Response },
	BlockBookmarkCreateAndFetch: { req: Commands.Rpc_BlockBookmark_CreateAndFetch_Request, res: Commands.Rpc_BlockBookmark_CreateAndFetch_Response },
	BlockBookmarkFetch: { req: Commands.Rpc_BlockBookmark_Fetch_Request, res: Commands.Rpc_BlockBookmark_Fetch_Response },
	BlockCopy: { req: Commands.Rpc_Block_Copy_Request, res: Commands.Rpc_Block_Copy_Response },
	BlockCreate: { req: Commands.Rpc_Block_Create_Request, res: Commands.Rpc_Block_Create_Response },
	BlockCreateWidget: { req: Commands.Rpc_Block_CreateWidget_Request, res: Commands.Rpc_Block_CreateWidget_Response },
	BlockCut: { req: Commands.Rpc_Block_Cut_Request, res: Commands.Rpc_Block_Cut_Response },
	BlockDataviewCreateFromExistingObject: { req: Commands.Rpc_BlockDataview_CreateFromExistingObject_Request, res: Commands.Rpc_BlockDataview_CreateFromExistingObject_Response },
	BlockDataviewFilterAdd: { req: Commands.Rpc_BlockDataview_Filter_Add_Request, res: Commands.Rpc_BlockDataview_Filter_Add_Response },
	BlockDataviewFilterRemove: { req: Commands.Rpc_BlockDataview_Filter_Remove_Request, res: Commands.Rpc_BlockDataview_Filter_Remove_Response },
	BlockDataviewFilterReplace: { req: Commands.Rpc_BlockDataview_Filter_Replace_Request, res: Commands.Rpc_BlockDataview_Filter_Replace_Response },
	BlockDataviewFilterSort: { req: Commands.Rpc_BlockDataview_Filter_Sort_Request, res: Commands.Rpc_BlockDataview_Filter_Sort_Response },
	BlockDataviewGroupOrderUpdate: { req: Commands.Rpc_BlockDataview_GroupOrder_Update_Request, res: Commands.Rpc_BlockDataview_GroupOrder_Update_Response },
	BlockDataviewObjectOrderMove: { req: Commands.Rpc_BlockDataview_ObjectOrder_Move_Request, res: Commands.Rpc_BlockDataview_ObjectOrder_Move_Response },
	BlockDataviewObjectOrderUpdate: { req: Commands.Rpc_BlockDataview_ObjectOrder_Update_Request, res: Commands.Rpc_BlockDataview_ObjectOrder_Update_Response },
	BlockDataviewRelationAdd: { req: Commands.Rpc_BlockDataview_Relation_Add_Request, res: Commands.Rpc_BlockDataview_Relation_Add_Response },
	BlockDataviewRelationDelete: { req: Commands.Rpc_BlockDataview_Relation_Delete_Request, res: Commands.Rpc_BlockDataview_Relation_Delete_Response },
	BlockDataviewRelationSet: { req: Commands.Rpc_BlockDataview_Relation_Set_Request, res: Commands.Rpc_BlockDataview_Relation_Set_Response },
	BlockDataviewSetSource: { req: Commands.Rpc_BlockDataview_SetSource_Request, res: Commands.Rpc_BlockDataview_SetSource_Response },
	BlockDataviewSortAdd: { req: Commands.Rpc_BlockDataview_Sort_Add_Request, res: Commands.Rpc_BlockDataview_Sort_Add_Response },
	BlockDataviewSortRemove: { req: Commands.Rpc_BlockDataview_Sort_Remove_Request, res: Commands.Rpc_BlockDataview_Sort_Remove_Response },
	BlockDataviewSortReplace: { req: Commands.Rpc_BlockDataview_Sort_Replace_Request, res: Commands.Rpc_BlockDataview_Sort_Replace_Response },
	BlockDataviewSortSort: { req: Commands.Rpc_BlockDataview_Sort_SSort_Request, res: Commands.Rpc_BlockDataview_Sort_SSort_Response },
	BlockDataviewViewCreate: { req: Commands.Rpc_BlockDataview_View_Create_Request, res: Commands.Rpc_BlockDataview_View_Create_Response },
	BlockDataviewViewDelete: { req: Commands.Rpc_BlockDataview_View_Delete_Request, res: Commands.Rpc_BlockDataview_View_Delete_Response },
	BlockDataviewViewRelationAdd: { req: Commands.Rpc_BlockDataview_ViewRelation_Add_Request, res: Commands.Rpc_BlockDataview_ViewRelation_Add_Response },
	BlockDataviewViewRelationRemove: { req: Commands.Rpc_BlockDataview_ViewRelation_Remove_Request, res: Commands.Rpc_BlockDataview_ViewRelation_Remove_Response },
	BlockDataviewViewRelationReplace: { req: Commands.Rpc_BlockDataview_ViewRelation_Replace_Request, res: Commands.Rpc_BlockDataview_ViewRelation_Replace_Response },
	BlockDataviewViewRelationSort: { req: Commands.Rpc_BlockDataview_ViewRelation_Sort_Request, res: Commands.Rpc_BlockDataview_ViewRelation_Sort_Response },
	BlockDataviewViewSetActive: { req: Commands.Rpc_BlockDataview_View_SetActive_Request, res: Commands.Rpc_BlockDataview_View_SetActive_Response },
	BlockDataviewViewSetPosition: { req: Commands.Rpc_BlockDataview_View_SetPosition_Request, res: Commands.Rpc_BlockDataview_View_SetPosition_Response },
	BlockDataviewViewUpdate: { req: Commands.Rpc_BlockDataview_View_Update_Request, res: Commands.Rpc_BlockDataview_View_Update_Response },
	BlockDivListSetStyle: { req: Commands.Rpc_BlockDiv_ListSetStyle_Request, res: Commands.Rpc_BlockDiv_ListSetStyle_Response },
	BlockExport: { req: Commands.Rpc_Block_Export_Request, res: Commands.Rpc_Block_Export_Response },
	BlockFileCreateAndUpload: { req: Commands.Rpc_BlockFile_CreateAndUpload_Request, res: Commands.Rpc_BlockFile_CreateAndUpload_Response },
	BlockFileListSetStyle: { req: Commands.Rpc_BlockFile_ListSetStyle_Request, res: Commands.Rpc_BlockFile_ListSetStyle_Response },
	BlockFileSetName: { req: Commands.Rpc_BlockFile_SetName_Request, res: Commands.Rpc_BlockFile_SetName_Response },
	BlockFileSetTargetObjectId: { req: Commands.Rpc_BlockFile_SetTargetObjectId_Request, res: Commands.Rpc_BlockFile_SetTargetObjectId_Response },
	BlockImageSetName: { req: Commands.Rpc_BlockImage_SetName_Request, res: Commands.Rpc_BlockImage_SetName_Response },
	BlockLatexSetText: { req: Commands.Rpc_BlockLatex_SetText_Request, res: Commands.Rpc_BlockLatex_SetText_Response },
	BlockLinkCreateWithObject: { req: Commands.Rpc_BlockLink_CreateWithObject_Request, res: Commands.Rpc_BlockLink_CreateWithObject_Response },
	BlockLinkListSetAppearance: { req: Commands.Rpc_BlockLink_ListSetAppearance_Request, res: Commands.Rpc_BlockLink_ListSetAppearance_Response },
	BlockListConvertToObjects: { req: Commands.Rpc_Block_ListConvertToObjects_Request, res: Commands.Rpc_Block_ListConvertToObjects_Response },
	BlockListDelete: { req: Commands.Rpc_Block_ListDelete_Request, res: Commands.Rpc_Block_ListDelete_Response },
	BlockListDuplicate: { req: Commands.Rpc_Block_ListDuplicate_Request, res: Commands.Rpc_Block_ListDuplicate_Response },
	BlockListMoveToExistingObject: { req: Commands.Rpc_Block_ListMoveToExistingObject_Request, res: Commands.Rpc_Block_ListMoveToExistingObject_Response },
	BlockListMoveToNewObject: { req: Commands.Rpc_Block_ListMoveToNewObject_Request, res: Commands.Rpc_Block_ListMoveToNewObject_Response },
	BlockListSetAlign: { req: Commands.Rpc_Block_ListSetAlign_Request, res: Commands.Rpc_Block_ListSetAlign_Response },
	BlockListSetBackgroundColor: { req: Commands.Rpc_Block_ListSetBackgroundColor_Request, res: Commands.Rpc_Block_ListSetBackgroundColor_Response },
	BlockListSetFields: { req: Commands.Rpc_Block_ListSetFields_Request, res: Commands.Rpc_Block_ListSetFields_Response },
	BlockListSetVerticalAlign: { req: Commands.Rpc_Block_ListSetVerticalAlign_Request, res: Commands.Rpc_Block_ListSetVerticalAlign_Response },
	BlockListTurnInto: { req: Commands.Rpc_Block_ListTurnInto_Request, res: Commands.Rpc_Block_ListTurnInto_Response },
	BlockMerge: { req: Commands.Rpc_Block_Merge_Request, res: Commands.Rpc_Block_Merge_Response },
	BlockPaste: { req: Commands.Rpc_Block_Paste_Request, res: Commands.Rpc_Block_Paste_Response },
	BlockPreview: { req: Commands.Rpc_Block_Preview_Request, res: Commands.Rpc_Block_Preview_Response },
	BlockRelationAdd: { req: Commands.Rpc_BlockRelation_Add_Request, res: Commands.Rpc_BlockRelation_Add_Response },
	BlockRelationSetKey: { req: Commands.Rpc_BlockRelation_SetKey_Request, res: Commands.Rpc_BlockRelation_SetKey_Response },
	BlockReplace: { req: Commands.Rpc_Block_Replace_Request, res: Commands.Rpc_Block_Replace_Response },
	BlockSetCarriage: { req: Commands.Rpc_Block_SetCarriage_Request, res: Commands.Rpc_Block_SetCarriage_Response },
	BlockSetFields: { req: Commands.Rpc_Block_SetFields_Request, res: Commands.Rpc_Block_SetFields_Response },
	BlockSplit: { req: Commands.Rpc_Block_Split_Request, res: Commands.Rpc_Block_Split_Response },
	BlockTableColumnCreate: { req: Commands.Rpc_BlockTable_ColumnCreate_Request, res: Commands.Rpc_BlockTable_ColumnCreate_Response },
	BlockTableColumnDelete: { req: Commands.Rpc_BlockTable_ColumnDelete_Request, res: Commands.Rpc_BlockTable_ColumnDelete_Response },
	BlockTableColumnDuplicate: { req: Commands.Rpc_BlockTable_ColumnDuplicate_Request, res: Commands.Rpc_BlockTable_ColumnDuplicate_Response },
	BlockTableColumnListFill: { req: Commands.Rpc_BlockTable_ColumnListFill_Request, res: Commands.Rpc_BlockTable_ColumnListFill_Response },
	BlockTableColumnMove: { req: Commands.Rpc_BlockTable_ColumnMove_Request, res: Commands.Rpc_BlockTable_ColumnMove_Response },
	BlockTableCreate: { req: Commands.Rpc_BlockTable_Create_Request, res: Commands.Rpc_BlockTable_Create_Response },
	BlockTableExpand: { req: Commands.Rpc_BlockTable_Expand_Request, res: Commands.Rpc_BlockTable_Expand_Response },
	BlockTableRowCreate: { req: Commands.Rpc_BlockTable_RowCreate_Request, res: Commands.Rpc_BlockTable_RowCreate_Response },
	BlockTableRowDelete: { req: Commands.Rpc_BlockTable_RowDelete_Request, res: Commands.Rpc_BlockTable_RowDelete_Response },
	BlockTableRowDuplicate: { req: Commands.Rpc_BlockTable_RowDuplicate_Request, res: Commands.Rpc_BlockTable_RowDuplicate_Response },
	BlockTableRowListClean: { req: Commands.Rpc_BlockTable_RowListClean_Request, res: Commands.Rpc_BlockTable_RowListClean_Response },
	BlockTableRowListFill: { req: Commands.Rpc_BlockTable_RowListFill_Request, res: Commands.Rpc_BlockTable_RowListFill_Response },
	BlockTableRowSetHeader: { req: Commands.Rpc_BlockTable_RowSetHeader_Request, res: Commands.Rpc_BlockTable_RowSetHeader_Response },
	BlockTableSort: { req: Commands.Rpc_BlockTable_Sort_Request, res: Commands.Rpc_BlockTable_Sort_Response },
	BlockTextListClearContent: { req: Commands.Rpc_BlockText_ListClearContent_Request, res: Commands.Rpc_BlockText_ListClearContent_Response },
	BlockTextListClearStyle: { req: Commands.Rpc_BlockText_ListClearStyle_Request, res: Commands.Rpc_BlockText_ListClearStyle_Response },
	BlockTextListSetColor: { req: Commands.Rpc_BlockText_ListSetColor_Request, res: Commands.Rpc_BlockText_ListSetColor_Response },
	BlockTextListSetMark: { req: Commands.Rpc_BlockText_ListSetMark_Request, res: Commands.Rpc_BlockText_ListSetMark_Response },
	BlockTextListSetStyle: { req: Commands.Rpc_BlockText_ListSetStyle_Request, res: Commands.Rpc_BlockText_ListSetStyle_Response },
	BlockTextSetChecked: { req: Commands.Rpc_BlockText_SetChecked_Request, res: Commands.Rpc_BlockText_SetChecked_Response },
	BlockTextSetColor: { req: Commands.Rpc_BlockText_SetColor_Request, res: Commands.Rpc_BlockText_SetColor_Response },
	BlockTextSetIcon: { req: Commands.Rpc_BlockText_SetIcon_Request, res: Commands.Rpc_BlockText_SetIcon_Response },
	BlockTextSetStyle: { req: Commands.Rpc_BlockText_SetStyle_Request, res: Commands.Rpc_BlockText_SetStyle_Response },
	BlockTextSetText: { req: Commands.Rpc_BlockText_SetText_Request, res: Commands.Rpc_BlockText_SetText_Response },
	BlockUpload: { req: Commands.Rpc_Block_Upload_Request, res: Commands.Rpc_Block_Upload_Response },
	BlockVideoSetName: { req: Commands.Rpc_BlockVideo_SetName_Request, res: Commands.Rpc_BlockVideo_SetName_Response },
	BlockWidgetSetLayout: { req: Commands.Rpc_BlockWidget_SetLayout_Request, res: Commands.Rpc_BlockWidget_SetLayout_Response },
	BlockWidgetSetLimit: { req: Commands.Rpc_BlockWidget_SetLimit_Request, res: Commands.Rpc_BlockWidget_SetLimit_Response },
	BlockWidgetSetTargetId: { req: Commands.Rpc_BlockWidget_SetTargetId_Request, res: Commands.Rpc_BlockWidget_SetTargetId_Response },
	BlockWidgetSetViewId: { req: Commands.Rpc_BlockWidget_SetViewId_Request, res: Commands.Rpc_BlockWidget_SetViewId_Response },
	BroadcastPayloadEvent: { req: Commands.Rpc_Broadcast_PayloadEvent_Request, res: Commands.Rpc_Broadcast_PayloadEvent_Response },
	ChatAddMessage: { req: Commands.Rpc_Chat_AddMessage_Request, res: Commands.Rpc_Chat_AddMessage_Response },
	ChatDeleteMessage: { req: Commands.Rpc_Chat_DeleteMessage_Request, res: Commands.Rpc_Chat_DeleteMessage_Response },
	ChatEditMessageContent: { req: Commands.Rpc_Chat_EditMessageContent_Request, res: Commands.Rpc_Chat_EditMessageContent_Response },
	ChatGetMessages: { req: Commands.Rpc_Chat_GetMessages_Request, res: Commands.Rpc_Chat_GetMessages_Response },
	ChatGetMessagesByIds: { req: Commands.Rpc_Chat_GetMessagesByIds_Request, res: Commands.Rpc_Chat_GetMessagesByIds_Response },
	ChatReadAll: { req: Commands.Rpc_Chat_ReadAll_Request, res: Commands.Rpc_Chat_ReadAll_Response },
	ChatReadMessages: { req: Commands.Rpc_Chat_ReadMessages_Request, res: Commands.Rpc_Chat_ReadMessages_Response },
	ChatSubscribeLastMessages: { req: Commands.Rpc_Chat_SubscribeLastMessages_Request, res: Commands.Rpc_Chat_SubscribeLastMessages_Response },
	ChatSubscribeToMessagePreviews: { req: Commands.Rpc_Chat_SubscribeToMessagePreviews_Request, res: Commands.Rpc_Chat_SubscribeToMessagePreviews_Response },
	ChatToggleMessageReaction: { req: Commands.Rpc_Chat_ToggleMessageReaction_Request, res: Commands.Rpc_Chat_ToggleMessageReaction_Response },
	ChatUnreadMessages: { req: Commands.Rpc_Chat_Unread_Request, res: Commands.Rpc_Chat_Unread_Response },
	ChatUnsubscribe: { req: Commands.Rpc_Chat_Unsubscribe_Request, res: Commands.Rpc_Chat_Unsubscribe_Response },
	ChatUnsubscribeFromMessagePreviews: { req: Commands.Rpc_Chat_UnsubscribeFromMessagePreviews_Request, res: Commands.Rpc_Chat_UnsubscribeFromMessagePreviews_Response },
	DebugAccountSelectTrace: { req: Commands.Rpc_Debug_AccountSelectTrace_Request, res: Commands.Rpc_Debug_AccountSelectTrace_Response },
	DebugAnystoreObjectChanges: { req: Commands.Rpc_Debug_AnystoreObjectChanges_Request, res: Commands.Rpc_Debug_AnystoreObjectChanges_Response },
	DebugExportLocalstore: { req: Commands.Rpc_Debug_ExportLocalstore_Request, res: Commands.Rpc_Debug_ExportLocalstore_Response },
	DebugExportLog: { req: Commands.Rpc_Debug_ExportLog_Request, res: Commands.Rpc_Debug_ExportLog_Response },
	DebugNetCheck: { req: Commands.Rpc_Debug_NetCheck_Request, res: Commands.Rpc_Debug_NetCheck_Response },
	DebugOpenedObjects: { req: Commands.Rpc_Debug_OpenedObjects_Request, res: Commands.Rpc_Debug_OpenedObjects_Response },
	DebugPing: { req: Commands.Rpc_Debug_Ping_Request, res: Commands.Rpc_Debug_Ping_Response },
	DebugRunProfiler: { req: Commands.Rpc_Debug_RunProfiler_Request, res: Commands.Rpc_Debug_RunProfiler_Response },
	DebugSpaceSummary: { req: Commands.Rpc_Debug_SpaceSummary_Request, res: Commands.Rpc_Debug_SpaceSummary_Response },
	DebugStackGoroutines: { req: Commands.Rpc_Debug_StackGoroutines_Request, res: Commands.Rpc_Debug_StackGoroutines_Response },
	DebugStat: { req: Commands.Rpc_Debug_Stat_Request, res: Commands.Rpc_Debug_Stat_Response },
	DebugSubscriptions: { req: Commands.Rpc_Debug_Subscriptions_Request, res: Commands.Rpc_Debug_Subscriptions_Response },
	DebugTree: { req: Commands.Rpc_Debug_Tree_Request, res: Commands.Rpc_Debug_Tree_Response },
	DebugTreeHeads: { req: Commands.Rpc_Debug_TreeHeads_Request, res: Commands.Rpc_Debug_TreeHeads_Response },
	DeviceList: { req: Commands.Rpc_Device_List_Request, res: Commands.Rpc_Device_List_Response },
	DeviceNetworkStateSet: { req: Commands.Rpc_Device_NetworkState_Set_Request, res: Commands.Rpc_Device_NetworkState_Set_Response },
	DeviceSetName: { req: Commands.Rpc_Device_SetName_Request, res: Commands.Rpc_Device_SetName_Response },
	FileCacheCancelDownload: { req: Commands.Rpc_File_CacheCancelDownload_Request, res: Commands.Rpc_File_CacheCancelDownload_Response },
	FileCacheDownload: { req: Commands.Rpc_File_CacheDownload_Request, res: Commands.Rpc_File_CacheDownload_Response },
	FileDiscardPreload: { req: Commands.Rpc_File_DiscardPreload_Request, res: Commands.Rpc_File_DiscardPreload_Response },
	FileDownload: { req: Commands.Rpc_File_Download_Request, res: Commands.Rpc_File_Download_Response },
	FileDrop: { req: Commands.Rpc_File_Drop_Request, res: Commands.Rpc_File_Drop_Response },
	FileListOffload: { req: Commands.Rpc_File_ListOffload_Request, res: Commands.Rpc_File_ListOffload_Response },
	FileNodeUsage: { req: Commands.Rpc_File_NodeUsage_Request, res: Commands.Rpc_File_NodeUsage_Response },
	FileReconcile: { req: Commands.Rpc_File_Reconcile_Request, res: Commands.Rpc_File_Reconcile_Response },
	FileSetAutoDownload: { req: Commands.Rpc_File_SetAutoDownload_Request, res: Commands.Rpc_File_SetAutoDownload_Response },
	FileSpaceOffload: { req: Commands.Rpc_File_SpaceOffload_Request, res: Commands.Rpc_File_SpaceOffload_Response },
	FileSpaceUsage: { req: Commands.Rpc_File_SpaceUsage_Request, res: Commands.Rpc_File_SpaceUsage_Response },
	FileUpload: { req: Commands.Rpc_File_Upload_Request, res: Commands.Rpc_File_Upload_Response },
	GalleryDownloadIndex: { req: Commands.Rpc_Gallery_DownloadIndex_Request, res: Commands.Rpc_Gallery_DownloadIndex_Response },
	GalleryDownloadManifest: { req: Commands.Rpc_Gallery_DownloadManifest_Request, res: Commands.Rpc_Gallery_DownloadManifest_Response },
	HistoryDiffVersions: { req: Commands.Rpc_History_DiffVersions_Request, res: Commands.Rpc_History_DiffVersions_Response },
	HistoryGetVersions: { req: Commands.Rpc_History_GetVersions_Request, res: Commands.Rpc_History_GetVersions_Response },
	HistorySetVersion: { req: Commands.Rpc_History_SetVersion_Request, res: Commands.Rpc_History_SetVersion_Response },
	HistoryShowVersion: { req: Commands.Rpc_History_ShowVersion_Request, res: Commands.Rpc_History_ShowVersion_Response },
	InitialSetParameters: { req: Commands.Rpc_Initial_SetParameters_Request, res: Commands.Rpc_Initial_SetParameters_Response },
	LinkPreview: { req: Commands.Rpc_LinkPreview_Request, res: Commands.Rpc_LinkPreview_Response },
	LogSend: { req: Commands.Rpc_Log_Send_Request, res: Commands.Rpc_Log_Send_Response },
	MembershipCodeGetInfo: { req: Commands.Rpc_Membership_CodeGetInfo_Request, res: Commands.Rpc_Membership_CodeGetInfo_Response },
	MembershipCodeRedeem: { req: Commands.Rpc_Membership_CodeRedeem_Request, res: Commands.Rpc_Membership_CodeRedeem_Response },
	MembershipFinalize: { req: Commands.Rpc_Membership_Finalize_Request, res: Commands.Rpc_Membership_Finalize_Response },
	MembershipGetPortalLinkUrl: { req: Commands.Rpc_Membership_GetPortalLinkUrl_Request, res: Commands.Rpc_Membership_GetPortalLinkUrl_Response },
	MembershipGetStatus: { req: Commands.Rpc_Membership_GetStatus_Request, res: Commands.Rpc_Membership_GetStatus_Response },
	MembershipGetTiers: { req: Commands.Rpc_Membership_GetTiers_Request, res: Commands.Rpc_Membership_GetTiers_Response },
	MembershipGetVerificationEmail: { req: Commands.Rpc_Membership_GetVerificationEmail_Request, res: Commands.Rpc_Membership_GetVerificationEmail_Response },
	MembershipGetVerificationEmailStatus: { req: Commands.Rpc_Membership_GetVerificationEmailStatus_Request, res: Commands.Rpc_Membership_GetVerificationEmailStatus_Response },
	MembershipIsNameValid: { req: Commands.Rpc_Membership_IsNameValid_Request, res: Commands.Rpc_Membership_IsNameValid_Response },
	MembershipRegisterPaymentRequest: { req: Commands.Rpc_Membership_RegisterPaymentRequest_Request, res: Commands.Rpc_Membership_RegisterPaymentRequest_Response },
	MembershipV2AnyNameAllocate: { req: Commands.Rpc_MembershipV2_AnyNameAllocate_Request, res: Commands.Rpc_MembershipV2_AnyNameAllocate_Response },
	MembershipV2AnyNameIsValid: { req: Commands.Rpc_MembershipV2_AnyNameIsValid_Request, res: Commands.Rpc_MembershipV2_AnyNameIsValid_Response },
	MembershipV2CartGet: { req: Commands.Rpc_MembershipV2_CartGet_Request, res: Commands.Rpc_MembershipV2_CartGet_Response },
	MembershipV2CartUpdate: { req: Commands.Rpc_MembershipV2_CartUpdate_Request, res: Commands.Rpc_MembershipV2_CartUpdate_Response },
	MembershipV2GetPortalLink: { req: Commands.Rpc_MembershipV2_GetPortalLink_Request, res: Commands.Rpc_MembershipV2_GetPortalLink_Response },
	MembershipV2GetProducts: { req: Commands.Rpc_MembershipV2_GetProducts_Request, res: Commands.Rpc_MembershipV2_GetProducts_Response },
	MembershipV2GetStatus: { req: Commands.Rpc_MembershipV2_GetStatus_Request, res: Commands.Rpc_MembershipV2_GetStatus_Response },
	MembershipVerifyAppStoreReceipt: { req: Commands.Rpc_Membership_VerifyAppStoreReceipt_Request, res: Commands.Rpc_Membership_VerifyAppStoreReceipt_Response },
	MembershipVerifyEmailCode: { req: Commands.Rpc_Membership_VerifyEmailCode_Request, res: Commands.Rpc_Membership_VerifyEmailCode_Response },
	NameServiceResolveAnyId: { req: Commands.Rpc_NameService_ResolveAnyId_Request, res: Commands.Rpc_NameService_ResolveAnyId_Response },
	NameServiceResolveName: { req: Commands.Rpc_NameService_ResolveName_Request, res: Commands.Rpc_NameService_ResolveName_Response },
	NameServiceUserAccountGet: { req: Commands.Rpc_NameService_UserAccount_Get_Request, res: Commands.Rpc_NameService_UserAccount_Get_Response },
	NavigationGetObjectInfoWithLinks: { req: Commands.Rpc_Navigation_GetObjectInfoWithLinks_Request, res: Commands.Rpc_Navigation_GetObjectInfoWithLinks_Response },
	NavigationListObjects: { req: Commands.Rpc_Navigation_ListObjects_Request, res: Commands.Rpc_Navigation_ListObjects_Response },
	NotificationList: { req: Commands.Rpc_Notification_List_Request, res: Commands.Rpc_Notification_List_Response },
	NotificationReply: { req: Commands.Rpc_Notification_Reply_Request, res: Commands.Rpc_Notification_Reply_Response },
	NotificationTest: { req: Commands.Rpc_Notification_Test_Request, res: Commands.Rpc_Notification_Test_Response },
	ObjectApplyTemplate: { req: Commands.Rpc_Object_ApplyTemplate_Request, res: Commands.Rpc_Object_ApplyTemplate_Response },
	ObjectBookmarkFetch: { req: Commands.Rpc_Object_BookmarkFetch_Request, res: Commands.Rpc_Object_BookmarkFetch_Response },
	ObjectChatAdd: { req: Commands.Rpc_Object_ChatAdd_Request, res: Commands.Rpc_Object_ChatAdd_Response },
	ObjectClose: { req: Commands.Rpc_Object_Close_Request, res: Commands.Rpc_Object_Close_Response },
	ObjectCollectionAdd: { req: Commands.Rpc_ObjectCollection_Add_Request, res: Commands.Rpc_ObjectCollection_Add_Response },
	ObjectCollectionRemove: { req: Commands.Rpc_ObjectCollection_Remove_Request, res: Commands.Rpc_ObjectCollection_Remove_Response },
	ObjectCollectionSort: { req: Commands.Rpc_ObjectCollection_Sort_Request, res: Commands.Rpc_ObjectCollection_Sort_Response },
	ObjectCreate: { req: Commands.Rpc_Object_Create_Request, res: Commands.Rpc_Object_Create_Response },
	ObjectCreateBookmark: { req: Commands.Rpc_Object_CreateBookmark_Request, res: Commands.Rpc_Object_CreateBookmark_Response },
	ObjectCreateFromUrl: { req: Commands.Rpc_Object_CreateFromUrl_Request, res: Commands.Rpc_Object_CreateFromUrl_Response },
	ObjectCreateObjectType: { req: Commands.Rpc_Object_CreateObjectType_Request, res: Commands.Rpc_Object_CreateObjectType_Response },
	ObjectCreateRelation: { req: Commands.Rpc_Object_CreateRelation_Request, res: Commands.Rpc_Object_CreateRelation_Response },
	ObjectCreateRelationOption: { req: Commands.Rpc_Object_CreateRelationOption_Request, res: Commands.Rpc_Object_CreateRelationOption_Response },
	ObjectCreateSet: { req: Commands.Rpc_Object_CreateSet_Request, res: Commands.Rpc_Object_CreateSet_Response },
	ObjectCrossSpaceSearchSubscribe: { req: Commands.Rpc_Object_CrossSpaceSearchSubscribe_Request, res: Commands.Rpc_Object_CrossSpaceSearchSubscribe_Response },
	ObjectCrossSpaceSearchUnsubscribe: { req: Commands.Rpc_Object_CrossSpaceSearchUnsubscribe_Request, res: Commands.Rpc_Object_CrossSpaceSearchUnsubscribe_Response },
	ObjectDateByTimestamp: { req: Commands.Rpc_Object_DateByTimestamp_Request, res: Commands.Rpc_Object_DateByTimestamp_Response },
	ObjectDuplicate: { req: Commands.Rpc_Object_Duplicate_Request, res: Commands.Rpc_Object_Duplicate_Response },
	ObjectExport: { req: Commands.Rpc_Object_Export_Request, res: Commands.Rpc_Object_Export_Response },
	ObjectGraph: { req: Commands.Rpc_Object_Graph_Request, res: Commands.Rpc_Object_Graph_Response },
	ObjectGroupsSubscribe: { req: Commands.Rpc_Object_GroupsSubscribe_Request, res: Commands.Rpc_Object_GroupsSubscribe_Response },
	ObjectImport: { req: Commands.Rpc_Object_Import_Request, res: Commands.Rpc_Object_Import_Response },
	ObjectImportExperience: { req: Commands.Rpc_Object_ImportExperience_Request, res: Commands.Rpc_Object_ImportExperience_Response },
	ObjectImportList: { req: Commands.Rpc_Object_ImportList_Request, res: Commands.Rpc_Object_ImportList_Response },
	ObjectImportNotionValidateToken: { req: Commands.Rpc_Object_Import_Notion_ValidateToken_Request, res: Commands.Rpc_Object_Import_Notion_ValidateToken_Response },
	ObjectImportUseCase: { req: Commands.Rpc_Object_ImportUseCase_Request, res: Commands.Rpc_Object_ImportUseCase_Response },
	ObjectListDelete: { req: Commands.Rpc_Object_ListDelete_Request, res: Commands.Rpc_Object_ListDelete_Response },
	ObjectListDuplicate: { req: Commands.Rpc_Object_ListDuplicate_Request, res: Commands.Rpc_Object_ListDuplicate_Response },
	ObjectListExport: { req: Commands.Rpc_Object_ListExport_Request, res: Commands.Rpc_Object_ListExport_Response },
	ObjectListModifyDetailValues: { req: Commands.Rpc_Object_ListModifyDetailValues_Request, res: Commands.Rpc_Object_ListModifyDetailValues_Response },
	ObjectListSetDetails: { req: Commands.Rpc_Object_ListSetDetails_Request, res: Commands.Rpc_Object_ListSetDetails_Response },
	ObjectListSetIsArchived: { req: Commands.Rpc_Object_ListSetIsArchived_Request, res: Commands.Rpc_Object_ListSetIsArchived_Response },
	ObjectListSetIsFavorite: { req: Commands.Rpc_Object_ListSetIsFavorite_Request, res: Commands.Rpc_Object_ListSetIsFavorite_Response },
	ObjectListSetObjectType: { req: Commands.Rpc_Object_ListSetObjectType_Request, res: Commands.Rpc_Object_ListSetObjectType_Response },
	ObjectOpen: { req: Commands.Rpc_Object_Open_Request, res: Commands.Rpc_Object_Open_Response },
	ObjectRedo: { req: Commands.Rpc_Object_Redo_Request, res: Commands.Rpc_Object_Redo_Response },
	ObjectRefresh: { req: Commands.Rpc_Object_Refresh_Request, res: Commands.Rpc_Object_Refresh_Response },
	ObjectRelationAdd: { req: Commands.Rpc_ObjectRelation_Add_Request, res: Commands.Rpc_ObjectRelation_Add_Response },
	ObjectRelationAddFeatured: { req: Commands.Rpc_ObjectRelation_AddFeatured_Request, res: Commands.Rpc_ObjectRelation_AddFeatured_Response },
	ObjectRelationDelete: { req: Commands.Rpc_ObjectRelation_Delete_Request, res: Commands.Rpc_ObjectRelation_Delete_Response },
	ObjectRelationListAvailable: { req: Commands.Rpc_ObjectRelation_ListAvailable_Request, res: Commands.Rpc_ObjectRelation_ListAvailable_Response },
	ObjectRelationRemoveFeatured: { req: Commands.Rpc_ObjectRelation_RemoveFeatured_Request, res: Commands.Rpc_ObjectRelation_RemoveFeatured_Response },
	ObjectSearch: { req: Commands.Rpc_Object_Search_Request, res: Commands.Rpc_Object_Search_Response },
	ObjectSearchSubscribe: { req: Commands.Rpc_Object_SearchSubscribe_Request, res: Commands.Rpc_Object_SearchSubscribe_Response },
	ObjectSearchUnsubscribe: { req: Commands.Rpc_Object_SearchUnsubscribe_Request, res: Commands.Rpc_Object_SearchUnsubscribe_Response },
	ObjectSearchWithMeta: { req: Commands.Rpc_Object_SearchWithMeta_Request, res: Commands.Rpc_Object_SearchWithMeta_Response },
	ObjectSetDetails: { req: Commands.Rpc_Object_SetDetails_Request, res: Commands.Rpc_Object_SetDetails_Response },
	ObjectSetInternalFlags: { req: Commands.Rpc_Object_SetInternalFlags_Request, res: Commands.Rpc_Object_SetInternalFlags_Response },
	ObjectSetIsArchived: { req: Commands.Rpc_Object_SetIsArchived_Request, res: Commands.Rpc_Object_SetIsArchived_Response },
	ObjectSetIsFavorite: { req: Commands.Rpc_Object_SetIsFavorite_Request, res: Commands.Rpc_Object_SetIsFavorite_Response },
	ObjectSetLayout: { req: Commands.Rpc_Object_SetLayout_Request, res: Commands.Rpc_Object_SetLayout_Response },
	ObjectSetObjectType: { req: Commands.Rpc_Object_SetObjectType_Request, res: Commands.Rpc_Object_SetObjectType_Response },
	ObjectSetSource: { req: Commands.Rpc_Object_SetSource_Request, res: Commands.Rpc_Object_SetSource_Response },
	ObjectShareByLink: { req: Commands.Rpc_Object_ShareByLink_Request, res: Commands.Rpc_Object_ShareByLink_Response },
	ObjectShow: { req: Commands.Rpc_Object_Show_Request, res: Commands.Rpc_Object_Show_Response },
	ObjectSubscribeIds: { req: Commands.Rpc_Object_SubscribeIds_Request, res: Commands.Rpc_Object_SubscribeIds_Response },
	ObjectToCollection: { req: Commands.Rpc_Object_ToCollection_Request, res: Commands.Rpc_Object_ToCollection_Response },
	ObjectToSet: { req: Commands.Rpc_Object_ToSet_Request, res: Commands.Rpc_Object_ToSet_Response },
	ObjectTypeListConflictingRelations: { req: Commands.Rpc_ObjectType_ListConflictingRelations_Request, res: Commands.Rpc_ObjectType_ListConflictingRelations_Response },
	ObjectTypeRecommendedFeaturedRelationsSet: { req: Commands.Rpc_ObjectType_Recommended_FeaturedRelationsSet_Request, res: Commands.Rpc_ObjectType_Recommended_FeaturedRelationsSet_Response },
	ObjectTypeRecommendedRelationsSet: { req: Commands.Rpc_ObjectType_Recommended_RelationsSet_Request, res: Commands.Rpc_ObjectType_Recommended_RelationsSet_Response },
	ObjectTypeRelationAdd: { req: Commands.Rpc_ObjectType_Relation_Add_Request, res: Commands.Rpc_ObjectType_Relation_Add_Response },
	ObjectTypeRelationRemove: { req: Commands.Rpc_ObjectType_Relation_Remove_Request, res: Commands.Rpc_ObjectType_Relation_Remove_Response },
	ObjectTypeResolveLayoutConflicts: { req: Commands.Rpc_ObjectType_ResolveLayoutConflicts_Request, res: Commands.Rpc_ObjectType_ResolveLayoutConflicts_Response },
	ObjectTypeSetOrder: { req: Commands.Rpc_ObjectType_SetOrder_Request, res: Commands.Rpc_ObjectType_SetOrder_Response },
	ObjectUndo: { req: Commands.Rpc_Object_Undo_Request, res: Commands.Rpc_Object_Undo_Response },
	ObjectWorkspaceSetDashboard: { req: Commands.Rpc_Object_WorkspaceSetDashboard_Request, res: Commands.Rpc_Object_WorkspaceSetDashboard_Response },
	ProcessCancel: { req: Commands.Rpc_Process_Cancel_Request, res: Commands.Rpc_Process_Cancel_Response },
	ProcessSubscribe: { req: Commands.Rpc_Process_Subscribe_Request, res: Commands.Rpc_Process_Subscribe_Response },
	ProcessUnsubscribe: { req: Commands.Rpc_Process_Unsubscribe_Request, res: Commands.Rpc_Process_Unsubscribe_Response },
	PublishingCreate: { req: Commands.Rpc_Publishing_Create_Request, res: Commands.Rpc_Publishing_Create_Response },
	PublishingGetStatus: { req: Commands.Rpc_Publishing_GetStatus_Request, res: Commands.Rpc_Publishing_GetStatus_Response },
	PublishingList: { req: Commands.Rpc_Publishing_List_Request, res: Commands.Rpc_Publishing_List_Response },
	PublishingRemove: { req: Commands.Rpc_Publishing_Remove_Request, res: Commands.Rpc_Publishing_Remove_Response },
	PublishingResolveUri: { req: Commands.Rpc_Publishing_ResolveUri_Request, res: Commands.Rpc_Publishing_ResolveUri_Response },
	PushNotificationRegisterToken: { req: Commands.Rpc_PushNotification_RegisterToken_Request, res: Commands.Rpc_PushNotification_RegisterToken_Response },
	PushNotificationResetIds: { req: Commands.Rpc_PushNotification_ResetIds_Request, res: Commands.Rpc_PushNotification_ResetIds_Response },
	PushNotificationSetForceModeIds: { req: Commands.Rpc_PushNotification_SetForceModeIds_Request, res: Commands.Rpc_PushNotification_SetForceModeIds_Response },
	PushNotificationSetSpaceMode: { req: Commands.Rpc_PushNotification_SetSpaceMode_Request, res: Commands.Rpc_PushNotification_SetSpaceMode_Response },
	RelationListRemoveOption: { req: Commands.Rpc_Relation_ListRemoveOption_Request, res: Commands.Rpc_Relation_ListRemoveOption_Response },
	RelationListWithValue: { req: Commands.Rpc_Relation_ListWithValue_Request, res: Commands.Rpc_Relation_ListWithValue_Response },
	RelationOptionSetOrder: { req: Commands.Rpc_Relation_Option_SetOrder_Request, res: Commands.Rpc_Relation_Option_SetOrder_Response },
	RelationOptions: { req: Commands.Rpc_Relation_Options_Request, res: Commands.Rpc_Relation_Options_Response },
	SpaceDelete: { req: Commands.Rpc_Space_Delete_Request, res: Commands.Rpc_Space_Delete_Response },
	SpaceInviteChange: { req: Commands.Rpc_Space_InviteChange_Request, res: Commands.Rpc_Space_InviteChange_Response },
	SpaceInviteGenerate: { req: Commands.Rpc_Space_InviteGenerate_Request, res: Commands.Rpc_Space_InviteGenerate_Response },
	SpaceInviteGetCurrent: { req: Commands.Rpc_Space_InviteGetCurrent_Request, res: Commands.Rpc_Space_InviteGetCurrent_Response },
	SpaceInviteGetGuest: { req: Commands.Rpc_Space_InviteGetGuest_Request, res: Commands.Rpc_Space_InviteGetGuest_Response },
	SpaceInviteRevoke: { req: Commands.Rpc_Space_InviteRevoke_Request, res: Commands.Rpc_Space_InviteRevoke_Response },
	SpaceInviteView: { req: Commands.Rpc_Space_InviteView_Request, res: Commands.Rpc_Space_InviteView_Response },
	SpaceJoin: { req: Commands.Rpc_Space_Join_Request, res: Commands.Rpc_Space_Join_Response },
	SpaceJoinCancel: { req: Commands.Rpc_Space_JoinCancel_Request, res: Commands.Rpc_Space_JoinCancel_Response },
	SpaceLeaveApprove: { req: Commands.Rpc_Space_LeaveApprove_Request, res: Commands.Rpc_Space_LeaveApprove_Response },
	SpaceMakeShareable: { req: Commands.Rpc_Space_MakeShareable_Request, res: Commands.Rpc_Space_MakeShareable_Response },
	SpaceParticipantPermissionsChange: { req: Commands.Rpc_Space_ParticipantPermissionsChange_Request, res: Commands.Rpc_Space_ParticipantPermissionsChange_Response },
	SpaceParticipantRemove: { req: Commands.Rpc_Space_ParticipantRemove_Request, res: Commands.Rpc_Space_ParticipantRemove_Response },
	SpaceRequestApprove: { req: Commands.Rpc_Space_RequestApprove_Request, res: Commands.Rpc_Space_RequestApprove_Response },
	SpaceRequestDecline: { req: Commands.Rpc_Space_RequestDecline_Request, res: Commands.Rpc_Space_RequestDecline_Response },
	SpaceSetOrder: { req: Commands.Rpc_Space_SetOrder_Request, res: Commands.Rpc_Space_SetOrder_Response },
	SpaceStopSharing: { req: Commands.Rpc_Space_StopSharing_Request, res: Commands.Rpc_Space_StopSharing_Response },
	SpaceUnsetOrder: { req: Commands.Rpc_Space_UnsetOrder_Request, res: Commands.Rpc_Space_UnsetOrder_Response },
	TemplateClone: { req: Commands.Rpc_Template_Clone_Request, res: Commands.Rpc_Template_Clone_Response },
	TemplateCreateFromObject: { req: Commands.Rpc_Template_CreateFromObject_Request, res: Commands.Rpc_Template_CreateFromObject_Response },
	TemplateExportAll: { req: Commands.Rpc_Template_ExportAll_Request, res: Commands.Rpc_Template_ExportAll_Response },
	UnsplashDownload: { req: Commands.Rpc_Unsplash_Download_Request, res: Commands.Rpc_Unsplash_Download_Response },
	UnsplashSearch: { req: Commands.Rpc_Unsplash_Search_Request, res: Commands.Rpc_Unsplash_Search_Response },
	WalletCloseSession: { req: Commands.Rpc_Wallet_CloseSession_Request, res: Commands.Rpc_Wallet_CloseSession_Response },
	WalletConvert: { req: Commands.Rpc_Wallet_Convert_Request, res: Commands.Rpc_Wallet_Convert_Response },
	WalletCreate: { req: Commands.Rpc_Wallet_Create_Request, res: Commands.Rpc_Wallet_Create_Response },
	WalletCreateSession: { req: Commands.Rpc_Wallet_CreateSession_Request, res: Commands.Rpc_Wallet_CreateSession_Response },
	WalletRecover: { req: Commands.Rpc_Wallet_Recover_Request, res: Commands.Rpc_Wallet_Recover_Response },
	WorkspaceCreate: { req: Commands.Rpc_Workspace_Create_Request, res: Commands.Rpc_Workspace_Create_Response },
	WorkspaceExport: { req: Commands.Rpc_Workspace_Export_Request, res: Commands.Rpc_Workspace_Export_Response },
	WorkspaceGetAll: { req: Commands.Rpc_Workspace_GetAll_Request, res: Commands.Rpc_Workspace_GetAll_Response },
	WorkspaceGetCurrent: { req: Commands.Rpc_Workspace_GetCurrent_Request, res: Commands.Rpc_Workspace_GetCurrent_Response },
	WorkspaceObjectAdd: { req: Commands.Rpc_Workspace_Object_Add_Request, res: Commands.Rpc_Workspace_Object_Add_Response },
	WorkspaceObjectListAdd: { req: Commands.Rpc_Workspace_Object_ListAdd_Request, res: Commands.Rpc_Workspace_Object_ListAdd_Response },
	WorkspaceObjectListRemove: { req: Commands.Rpc_Workspace_Object_ListRemove_Request, res: Commands.Rpc_Workspace_Object_ListRemove_Response },
	WorkspaceOpen: { req: Commands.Rpc_Workspace_Open_Request, res: Commands.Rpc_Workspace_Open_Response },
	WorkspaceSelect: { req: Commands.Rpc_Workspace_Select_Request, res: Commands.Rpc_Workspace_Select_Response },
	WorkspaceSetInfo: { req: Commands.Rpc_Workspace_SetInfo_Request, res: Commands.Rpc_Workspace_SetInfo_Response },
};

export class ServiceClient {

	private client: GrpcWebClientBase;
	private hostname: string;
	private descriptorCache = new Map<string, MethodDescriptor<any, any>>();

	constructor (hostname: string, credentials: any, options: any) {
		this.hostname = hostname;
		this.client = new GrpcWebClientBase(options);
	};

	getDescriptor (commandName: string): MethodDescriptor<any, any> | null {
		let descriptor = this.descriptorCache.get(commandName);
		if (descriptor) {
			return descriptor;
		};

		const entry = registry[commandName];
		if (!entry) {
			return null;
		};

		descriptor = new MethodDescriptor(
			`/anytype.ClientCommands/${commandName}`,
			MethodType.UNARY,
			Object as any,
			Object as any,
			(request: any) => entry.req.encode(entry.req.fromPartial(request)).finish(),
			(bytes: Uint8Array) => {
				const res = entry.res.decode(bytes);
				if (!res.toObject) {
					res.toObject = function () { return this; };
				};
				return res;
			},
		);

		this.descriptorCache.set(commandName, descriptor);
		return descriptor;
	};

	request (commandName: string, data: any, metadata: any, callback: (error: any, response: any) => void) {
		const descriptor = this.getDescriptor(commandName);

		if (!descriptor) {
			console.error('[ServiceClient] Unknown command:', commandName);
			callback({ code: 1, message: 'Unknown command: ' + commandName }, null);
			return;
		};

		// gRPC DevTools interceptor calls getRequestMessage().toObject()
		if (!data.toObject) {
			data.toObject = function () { return this; };
		};

		return this.client.rpcCall(
			this.hostname + `/anytype.ClientCommands/${commandName}`,
			data,
			metadata,
			descriptor,
			callback,
		);
	};

	listenSessionEvents (request: Commands.StreamRequest, metadata: any): ClientReadableStream<Events.Event> {
		const descriptor = new MethodDescriptor(
			'/anytype.ClientCommands/ListenSessionEvents',
			MethodType.SERVER_STREAMING,
			Object as any,
			Object as any,
			(req: any) => Commands.StreamRequest.encode(Commands.StreamRequest.fromPartial(req)).finish(),
			(bytes: Uint8Array) => {
				const res = Events.Event.decode(bytes) as any;
				if (!res.toObject) {
					res.toObject = function () { return this; };
				};
				return res;
			},
		);

		// gRPC DevTools interceptor calls getRequestMessage().toObject()
		if (!(request as any).toObject) {
			(request as any).toObject = function () { return this; };
		};

		return this.client.serverStreaming(
			this.hostname + '/anytype.ClientCommands/ListenSessionEvents',
			request,
			metadata || {},
			descriptor,
		) as ClientReadableStream<Events.Event>;
	};

};
