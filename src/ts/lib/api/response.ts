import { Mapper } from 'Lib';
import { Decode, Commands } from 'Lib/api/pb';

export const AccountDelete = (response: Commands.Rpc_Account_Delete_Response) => {
	return {
		status: Mapper.From.AccountStatus(response.status),
	};
};

export const AccountRecoverFromLegacyExport = (response: Commands.Rpc_Account_RecoverFromLegacyExport_Response) => {
	return {
		accountId: response.accountId,
		spaceId: response.personalSpaceId,
	};
};

export const AccountLocalLinkSolveChallenge = (response: Commands.Rpc_Account_LocalLink_SolveChallenge_Response) => {
	return {
		token: response.sessionToken,
		appKey: response.appKey,
	};
};

export const DebugStat = (response: Commands.Rpc_Debug_Stat_Response) => {
	let res = {};
	try { res = JSON.parse(response.jsonStat); } catch (e) { /**/ };
	return res;
};

export const FileListOffload = (response: Commands.Rpc_File_ListOffload_Response) => {
	return {
		files: response.filesOffloaded,
		bytes: response.bytesOffloaded,
	};
};

export const FileNodeUsage = (response: Commands.Rpc_File_NodeUsage_Response) => {
	const usage = response.usage;
	
	let res = {
		spaces: response.spaces,
	};

	if (usage) {
		res = Object.assign(res, {
			bytesLimit: usage.bytesLimit,
			localUsage: usage.localBytesUsage,
		});
	};

	return res;
};

export const FileUpload = (response: Commands.Rpc_File_Upload_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const FileDownload = (response: Commands.Rpc_File_Download_Response) => {
	return {
		path: response.localPath,
	};
};

export const ObjectImport = (response: Commands.Rpc_Object_Import_Response) => {
	return {
		collectionId: response.collectionId,
		count: response.objectsCount,
	};
};

export const ObjectCreate = (response: Commands.Rpc_Object_Create_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const ObjectCreateSet = (response: Commands.Rpc_Object_CreateSet_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const ObjectCreateBookmark = (response: Commands.Rpc_Object_CreateBookmark_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const ObjectCreateFromUrl = (response: Commands.Rpc_Object_CreateFromUrl_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const ObjectCreateObjectType = (response: Commands.Rpc_Object_CreateObjectType_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const ObjectCreateRelation = (response: Commands.Rpc_Object_CreateRelation_Response) => {
	return {
		objectId: response.objectId,
		relationKey: response.key,
		details: Decode.struct(response.details),
	};
};

export const ObjectCreateRelationOption = (response: Commands.Rpc_Object_CreateRelationOption_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const ObjectOpen = (response: Commands.Rpc_Object_Open_Response) => {
	return {
		objectView: Mapper.From.ObjectView(response.objectView),
	};
};

export const ObjectShow = (response: Commands.Rpc_Object_Show_Response) => {
	return {
		objectView: Mapper.From.ObjectView(response.objectView),
	};
};

export const ObjectSearch = (response: Commands.Rpc_Object_Search_Response) => {
	return {
		records: (response.records || []).map(Decode.struct),
	};
};

export const ObjectSearchWithMeta = (response: Commands.Rpc_Object_SearchWithMeta_Response) => {
	return {
		records: (response.results || []).map(Mapper.From.ObjectSearchWithMeta),
	};
};

export const ObjectGroupsSubscribe = (response: Commands.Rpc_Object_GroupsSubscribe_Response) => {
	return {
		subId: response.subId,
		groups: (response.groups || []).map(Mapper.From.BoardGroup),
	};
};

export const ObjectSearchSubscribe = (response: Commands.Rpc_Object_SearchSubscribe_Response) => {
	return {
		counters: response.counters,
		records: (response.records || []).map(Decode.struct),
		dependencies: (response.dependencies || []).map(Decode.struct),
	};
};

export const ObjectSubscribeIds = (response: Commands.Rpc_Object_SubscribeIds_Response) => {
	return {
		records: (response.records || []).map(Decode.struct),
		dependencies: (response.dependencies || []).map(Decode.struct),
	};
};

export const ObjectGraph = (response: Commands.Rpc_Object_Graph_Response) => {
	return {
		edges: (response.edges || []).map(Mapper.From.GraphEdge),
		nodes: (response.nodes || []).map(Decode.struct),
	};
};

export const BlockPreview = (response: Commands.Rpc_Block_Preview_Response) => {
	return {
		blocks: (response.blocks || []).map(Mapper.From.Block),
	};
};

export const BlockDataviewCreateFromExistingObject = (response: Commands.Rpc_BlockDataview_CreateFromExistingObject_Response) => {
	return {
		blockId: response.blockId,
		targetObjectId: response.targetObjectId,
		views: (response.view || []).map(Mapper.From.View),
	};
};

export const BlockLinkCreateWithObject = (response: Commands.Rpc_BlockLink_CreateWithObject_Response) => {
	return {
		blockId: response.blockId,
		targetId: response.targetId,
		details: Decode.struct(response.details),
	};
};

export const HistoryShowVersion = (response: Commands.Rpc_History_ShowVersion_Response) => {
	return {
		version: response.version,
		objectView: Mapper.From.ObjectView(response.objectView),
	};
};

export const HistoryDiffVersions = (response: Commands.Rpc_History_DiffVersions_Response) => {
	return {
		events: (response.historyEvents || []).map(it => {
			const type = it.value.oneofKind;
			const data = Mapper.Event.Data(it);
			const mapped = Mapper.Event[type] ? Mapper.Event[type](data) : data;

			return { type, data: mapped };
		}),
	};
};

export const NavigationGetObjectInfoWithLinks = (response: Commands.Rpc_Navigation_GetObjectInfoWithLinks_Response) => {
	const object = response.object;
	const links = object.links;

	return {
		object: {
			id: object.id,
			info: Mapper.From.ObjectInfo(object.info),
			links: {
				inbound: (links.inbound || []).map(Mapper.From.ObjectInfo),
				outbound: (links.outbound || []).map(Mapper.From.ObjectInfo),
			},
		},
	};
};

export const WorkspaceCreate = (response: Commands.Rpc_Workspace_Create_Response) => {
	return {
		objectId: response.spaceId,
	};
};

export const WorkspaceObjectAdd = (response: Commands.Rpc_Workspace_Object_Add_Response) => {
	return {
		objectId: response.objectId,
		details: Decode.struct(response.details),
	};
};

export const UnsplashSearch = (response: Commands.Rpc_Unsplash_Search_Response) => {
	return {
		pictures: (response.pictures || []).map(Mapper.From.UnsplashPicture),
	};
};

export const NotificationList = (response: Commands.Rpc_Notification_List_Response) => {
	return {
		list: (response.notifications || []).map(Mapper.From.Notification),
	};
};

export const MembershipGetStatus = (response: Commands.Rpc_Membership_GetStatus_Response) => {
	return {
		membership: Mapper.From.Membership(response.data),
	};
};

export const MembershipGetTiers = (response: Commands.Rpc_Membership_GetTiers_Response) => {
	return {
		tiers: (response.tiers || []).map(it => Mapper.From.MembershipTierData(it)),
	};
};

export const MembershipRegisterPaymentRequest = (response: Commands.Rpc_Membership_RegisterPaymentRequest_Response) => {
	return {
		url: response.paymentUrl,
	};
};

export const MembershipGetPortalLinkUrl = (response: Commands.Rpc_Membership_GetPortalLinkUrl_Response) => {
	return { 
		url: response.portalUrl,
	};
};

export const SpaceInviteGenerate = (response: Commands.Rpc_Space_InviteGenerate_Response) => {
	return {
		inviteCid: response.inviteCid,
		inviteKey: response.inviteFileKey,
	};
};

export const SpaceInviteGetCurrent = (response: Commands.Rpc_Space_InviteGetCurrent_Response) => {
	return {
		inviteCid: response.inviteCid,
		inviteKey: response.inviteFileKey,
	};
};