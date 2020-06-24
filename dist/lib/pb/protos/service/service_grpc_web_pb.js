/**
 * @fileoverview gRPC-Web generated client stub for anytype
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');


var pb_protos_commands_pb = require('../../../pb/protos/commands_pb.js')

var pb_protos_events_pb = require('../../../pb/protos/events_pb.js')
const proto = {};
proto.anytype = require('./service_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.anytype.ClientCommandsClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.anytype.ClientCommandsPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Wallet.Create.Request,
 *   !proto.anytype.Rpc.Wallet.Create.Response>}
 */
const methodDescriptor_ClientCommands_WalletCreate = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/WalletCreate',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Wallet.Create.Request,
  pb_protos_commands_pb.Rpc.Wallet.Create.Response,
  /**
   * @param {!proto.anytype.Rpc.Wallet.Create.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Wallet.Create.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Wallet.Create.Request,
 *   !proto.anytype.Rpc.Wallet.Create.Response>}
 */
const methodInfo_ClientCommands_WalletCreate = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Wallet.Create.Response,
  /**
   * @param {!proto.anytype.Rpc.Wallet.Create.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Wallet.Create.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Wallet.Create.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Wallet.Create.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Wallet.Create.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.walletCreate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/WalletCreate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_WalletCreate,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Wallet.Create.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Wallet.Create.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.walletCreate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/WalletCreate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_WalletCreate);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Wallet.Recover.Request,
 *   !proto.anytype.Rpc.Wallet.Recover.Response>}
 */
const methodDescriptor_ClientCommands_WalletRecover = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/WalletRecover',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Wallet.Recover.Request,
  pb_protos_commands_pb.Rpc.Wallet.Recover.Response,
  /**
   * @param {!proto.anytype.Rpc.Wallet.Recover.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Wallet.Recover.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Wallet.Recover.Request,
 *   !proto.anytype.Rpc.Wallet.Recover.Response>}
 */
const methodInfo_ClientCommands_WalletRecover = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Wallet.Recover.Response,
  /**
   * @param {!proto.anytype.Rpc.Wallet.Recover.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Wallet.Recover.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Wallet.Recover.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Wallet.Recover.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Wallet.Recover.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.walletRecover =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/WalletRecover',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_WalletRecover,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Wallet.Recover.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Wallet.Recover.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.walletRecover =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/WalletRecover',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_WalletRecover);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Account.Recover.Request,
 *   !proto.anytype.Rpc.Account.Recover.Response>}
 */
const methodDescriptor_ClientCommands_AccountRecover = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/AccountRecover',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Account.Recover.Request,
  pb_protos_commands_pb.Rpc.Account.Recover.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Recover.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Recover.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Account.Recover.Request,
 *   !proto.anytype.Rpc.Account.Recover.Response>}
 */
const methodInfo_ClientCommands_AccountRecover = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Account.Recover.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Recover.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Recover.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Account.Recover.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Account.Recover.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Account.Recover.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.accountRecover =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/AccountRecover',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountRecover,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Account.Recover.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Account.Recover.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.accountRecover =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/AccountRecover',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountRecover);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Account.Create.Request,
 *   !proto.anytype.Rpc.Account.Create.Response>}
 */
const methodDescriptor_ClientCommands_AccountCreate = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/AccountCreate',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Account.Create.Request,
  pb_protos_commands_pb.Rpc.Account.Create.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Create.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Create.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Account.Create.Request,
 *   !proto.anytype.Rpc.Account.Create.Response>}
 */
const methodInfo_ClientCommands_AccountCreate = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Account.Create.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Create.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Create.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Account.Create.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Account.Create.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Account.Create.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.accountCreate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/AccountCreate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountCreate,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Account.Create.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Account.Create.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.accountCreate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/AccountCreate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountCreate);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Account.Select.Request,
 *   !proto.anytype.Rpc.Account.Select.Response>}
 */
const methodDescriptor_ClientCommands_AccountSelect = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/AccountSelect',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Account.Select.Request,
  pb_protos_commands_pb.Rpc.Account.Select.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Select.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Select.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Account.Select.Request,
 *   !proto.anytype.Rpc.Account.Select.Response>}
 */
const methodInfo_ClientCommands_AccountSelect = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Account.Select.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Select.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Select.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Account.Select.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Account.Select.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Account.Select.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.accountSelect =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/AccountSelect',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountSelect,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Account.Select.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Account.Select.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.accountSelect =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/AccountSelect',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountSelect);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Account.Stop.Request,
 *   !proto.anytype.Rpc.Account.Stop.Response>}
 */
const methodDescriptor_ClientCommands_AccountStop = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/AccountStop',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Account.Stop.Request,
  pb_protos_commands_pb.Rpc.Account.Stop.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Stop.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Stop.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Account.Stop.Request,
 *   !proto.anytype.Rpc.Account.Stop.Response>}
 */
const methodInfo_ClientCommands_AccountStop = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Account.Stop.Response,
  /**
   * @param {!proto.anytype.Rpc.Account.Stop.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Account.Stop.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Account.Stop.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Account.Stop.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Account.Stop.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.accountStop =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/AccountStop',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountStop,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Account.Stop.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Account.Stop.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.accountStop =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/AccountStop',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_AccountStop);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Ipfs.Image.Get.Blob.Request,
 *   !proto.anytype.Rpc.Ipfs.Image.Get.Blob.Response>}
 */
const methodDescriptor_ClientCommands_ImageGetBlob = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/ImageGetBlob',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Ipfs.Image.Get.Blob.Request,
  pb_protos_commands_pb.Rpc.Ipfs.Image.Get.Blob.Response,
  /**
   * @param {!proto.anytype.Rpc.Ipfs.Image.Get.Blob.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Ipfs.Image.Get.Blob.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Ipfs.Image.Get.Blob.Request,
 *   !proto.anytype.Rpc.Ipfs.Image.Get.Blob.Response>}
 */
const methodInfo_ClientCommands_ImageGetBlob = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Ipfs.Image.Get.Blob.Response,
  /**
   * @param {!proto.anytype.Rpc.Ipfs.Image.Get.Blob.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Ipfs.Image.Get.Blob.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Ipfs.Image.Get.Blob.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Ipfs.Image.Get.Blob.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Ipfs.Image.Get.Blob.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.imageGetBlob =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/ImageGetBlob',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ImageGetBlob,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Ipfs.Image.Get.Blob.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Ipfs.Image.Get.Blob.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.imageGetBlob =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/ImageGetBlob',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ImageGetBlob);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Version.Get.Request,
 *   !proto.anytype.Rpc.Version.Get.Response>}
 */
const methodDescriptor_ClientCommands_VersionGet = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/VersionGet',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Version.Get.Request,
  pb_protos_commands_pb.Rpc.Version.Get.Response,
  /**
   * @param {!proto.anytype.Rpc.Version.Get.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Version.Get.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Version.Get.Request,
 *   !proto.anytype.Rpc.Version.Get.Response>}
 */
const methodInfo_ClientCommands_VersionGet = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Version.Get.Response,
  /**
   * @param {!proto.anytype.Rpc.Version.Get.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Version.Get.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Version.Get.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Version.Get.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Version.Get.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.versionGet =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/VersionGet',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_VersionGet,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Version.Get.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Version.Get.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.versionGet =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/VersionGet',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_VersionGet);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Log.Send.Request,
 *   !proto.anytype.Rpc.Log.Send.Response>}
 */
const methodDescriptor_ClientCommands_LogSend = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/LogSend',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Log.Send.Request,
  pb_protos_commands_pb.Rpc.Log.Send.Response,
  /**
   * @param {!proto.anytype.Rpc.Log.Send.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Log.Send.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Log.Send.Request,
 *   !proto.anytype.Rpc.Log.Send.Response>}
 */
const methodInfo_ClientCommands_LogSend = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Log.Send.Response,
  /**
   * @param {!proto.anytype.Rpc.Log.Send.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Log.Send.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Log.Send.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Log.Send.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Log.Send.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.logSend =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/LogSend',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_LogSend,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Log.Send.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Log.Send.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.logSend =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/LogSend',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_LogSend);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Config.Get.Request,
 *   !proto.anytype.Rpc.Config.Get.Response>}
 */
const methodDescriptor_ClientCommands_ConfigGet = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/ConfigGet',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Config.Get.Request,
  pb_protos_commands_pb.Rpc.Config.Get.Response,
  /**
   * @param {!proto.anytype.Rpc.Config.Get.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Config.Get.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Config.Get.Request,
 *   !proto.anytype.Rpc.Config.Get.Response>}
 */
const methodInfo_ClientCommands_ConfigGet = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Config.Get.Response,
  /**
   * @param {!proto.anytype.Rpc.Config.Get.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Config.Get.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Config.Get.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Config.Get.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Config.Get.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.configGet =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/ConfigGet',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ConfigGet,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Config.Get.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Config.Get.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.configGet =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/ConfigGet',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ConfigGet);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Shutdown.Request,
 *   !proto.anytype.Rpc.Shutdown.Response>}
 */
const methodDescriptor_ClientCommands_Shutdown = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/Shutdown',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Shutdown.Request,
  pb_protos_commands_pb.Rpc.Shutdown.Response,
  /**
   * @param {!proto.anytype.Rpc.Shutdown.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Shutdown.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Shutdown.Request,
 *   !proto.anytype.Rpc.Shutdown.Response>}
 */
const methodInfo_ClientCommands_Shutdown = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Shutdown.Response,
  /**
   * @param {!proto.anytype.Rpc.Shutdown.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Shutdown.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Shutdown.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Shutdown.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Shutdown.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.shutdown =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/Shutdown',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_Shutdown,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Shutdown.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Shutdown.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.shutdown =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/Shutdown',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_Shutdown);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.ExternalDrop.Files.Request,
 *   !proto.anytype.Rpc.ExternalDrop.Files.Response>}
 */
const methodDescriptor_ClientCommands_ExternalDropFiles = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/ExternalDropFiles',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.ExternalDrop.Files.Request,
  pb_protos_commands_pb.Rpc.ExternalDrop.Files.Response,
  /**
   * @param {!proto.anytype.Rpc.ExternalDrop.Files.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.ExternalDrop.Files.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.ExternalDrop.Files.Request,
 *   !proto.anytype.Rpc.ExternalDrop.Files.Response>}
 */
const methodInfo_ClientCommands_ExternalDropFiles = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.ExternalDrop.Files.Response,
  /**
   * @param {!proto.anytype.Rpc.ExternalDrop.Files.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.ExternalDrop.Files.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.ExternalDrop.Files.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.ExternalDrop.Files.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.ExternalDrop.Files.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.externalDropFiles =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/ExternalDropFiles',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ExternalDropFiles,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.ExternalDrop.Files.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.ExternalDrop.Files.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.externalDropFiles =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/ExternalDropFiles',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ExternalDropFiles);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.ExternalDrop.Content.Request,
 *   !proto.anytype.Rpc.ExternalDrop.Content.Response>}
 */
const methodDescriptor_ClientCommands_ExternalDropContent = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/ExternalDropContent',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.ExternalDrop.Content.Request,
  pb_protos_commands_pb.Rpc.ExternalDrop.Content.Response,
  /**
   * @param {!proto.anytype.Rpc.ExternalDrop.Content.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.ExternalDrop.Content.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.ExternalDrop.Content.Request,
 *   !proto.anytype.Rpc.ExternalDrop.Content.Response>}
 */
const methodInfo_ClientCommands_ExternalDropContent = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.ExternalDrop.Content.Response,
  /**
   * @param {!proto.anytype.Rpc.ExternalDrop.Content.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.ExternalDrop.Content.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.ExternalDrop.Content.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.ExternalDrop.Content.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.ExternalDrop.Content.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.externalDropContent =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/ExternalDropContent',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ExternalDropContent,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.ExternalDrop.Content.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.ExternalDrop.Content.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.externalDropContent =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/ExternalDropContent',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ExternalDropContent);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.LinkPreview.Request,
 *   !proto.anytype.Rpc.LinkPreview.Response>}
 */
const methodDescriptor_ClientCommands_LinkPreview = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/LinkPreview',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.LinkPreview.Request,
  pb_protos_commands_pb.Rpc.LinkPreview.Response,
  /**
   * @param {!proto.anytype.Rpc.LinkPreview.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.LinkPreview.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.LinkPreview.Request,
 *   !proto.anytype.Rpc.LinkPreview.Response>}
 */
const methodInfo_ClientCommands_LinkPreview = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.LinkPreview.Response,
  /**
   * @param {!proto.anytype.Rpc.LinkPreview.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.LinkPreview.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.LinkPreview.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.LinkPreview.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.LinkPreview.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.linkPreview =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/LinkPreview',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_LinkPreview,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.LinkPreview.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.LinkPreview.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.linkPreview =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/LinkPreview',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_LinkPreview);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.UploadFile.Request,
 *   !proto.anytype.Rpc.UploadFile.Response>}
 */
const methodDescriptor_ClientCommands_UploadFile = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/UploadFile',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.UploadFile.Request,
  pb_protos_commands_pb.Rpc.UploadFile.Response,
  /**
   * @param {!proto.anytype.Rpc.UploadFile.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.UploadFile.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.UploadFile.Request,
 *   !proto.anytype.Rpc.UploadFile.Response>}
 */
const methodInfo_ClientCommands_UploadFile = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.UploadFile.Response,
  /**
   * @param {!proto.anytype.Rpc.UploadFile.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.UploadFile.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.UploadFile.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.UploadFile.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.UploadFile.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.uploadFile =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/UploadFile',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_UploadFile,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.UploadFile.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.UploadFile.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.uploadFile =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/UploadFile',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_UploadFile);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Upload.Request,
 *   !proto.anytype.Rpc.Block.Upload.Response>}
 */
const methodDescriptor_ClientCommands_BlockUpload = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockUpload',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Upload.Request,
  pb_protos_commands_pb.Rpc.Block.Upload.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Upload.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Upload.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Upload.Request,
 *   !proto.anytype.Rpc.Block.Upload.Response>}
 */
const methodInfo_ClientCommands_BlockUpload = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Upload.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Upload.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Upload.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Upload.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Upload.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Upload.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockUpload =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockUpload',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockUpload,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Upload.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Upload.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockUpload =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockUpload',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockUpload);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Replace.Request,
 *   !proto.anytype.Rpc.Block.Replace.Response>}
 */
const methodDescriptor_ClientCommands_BlockReplace = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockReplace',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Replace.Request,
  pb_protos_commands_pb.Rpc.Block.Replace.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Replace.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Replace.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Replace.Request,
 *   !proto.anytype.Rpc.Block.Replace.Response>}
 */
const methodInfo_ClientCommands_BlockReplace = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Replace.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Replace.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Replace.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Replace.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Replace.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Replace.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockReplace =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockReplace',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockReplace,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Replace.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Replace.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockReplace =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockReplace',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockReplace);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Open.Request,
 *   !proto.anytype.Rpc.Block.Open.Response>}
 */
const methodDescriptor_ClientCommands_BlockOpen = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockOpen',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Open.Request,
  pb_protos_commands_pb.Rpc.Block.Open.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Open.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Open.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Open.Request,
 *   !proto.anytype.Rpc.Block.Open.Response>}
 */
const methodInfo_ClientCommands_BlockOpen = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Open.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Open.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Open.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Open.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Open.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Open.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockOpen =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockOpen',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockOpen,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Open.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Open.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockOpen =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockOpen',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockOpen);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.GetPublicWebURL.Request,
 *   !proto.anytype.Rpc.Block.GetPublicWebURL.Response>}
 */
const methodDescriptor_ClientCommands_BlockGetPublicWebURL = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockGetPublicWebURL',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.GetPublicWebURL.Request,
  pb_protos_commands_pb.Rpc.Block.GetPublicWebURL.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.GetPublicWebURL.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.GetPublicWebURL.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.GetPublicWebURL.Request,
 *   !proto.anytype.Rpc.Block.GetPublicWebURL.Response>}
 */
const methodInfo_ClientCommands_BlockGetPublicWebURL = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.GetPublicWebURL.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.GetPublicWebURL.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.GetPublicWebURL.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.GetPublicWebURL.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.GetPublicWebURL.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.GetPublicWebURL.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockGetPublicWebURL =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockGetPublicWebURL',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockGetPublicWebURL,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.GetPublicWebURL.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.GetPublicWebURL.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockGetPublicWebURL =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockGetPublicWebURL',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockGetPublicWebURL);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.OpenBreadcrumbs.Request,
 *   !proto.anytype.Rpc.Block.OpenBreadcrumbs.Response>}
 */
const methodDescriptor_ClientCommands_BlockOpenBreadcrumbs = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockOpenBreadcrumbs',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.OpenBreadcrumbs.Request,
  pb_protos_commands_pb.Rpc.Block.OpenBreadcrumbs.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.OpenBreadcrumbs.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.OpenBreadcrumbs.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.OpenBreadcrumbs.Request,
 *   !proto.anytype.Rpc.Block.OpenBreadcrumbs.Response>}
 */
const methodInfo_ClientCommands_BlockOpenBreadcrumbs = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.OpenBreadcrumbs.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.OpenBreadcrumbs.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.OpenBreadcrumbs.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.OpenBreadcrumbs.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.OpenBreadcrumbs.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.OpenBreadcrumbs.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockOpenBreadcrumbs =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockOpenBreadcrumbs',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockOpenBreadcrumbs,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.OpenBreadcrumbs.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.OpenBreadcrumbs.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockOpenBreadcrumbs =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockOpenBreadcrumbs',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockOpenBreadcrumbs);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.SetBreadcrumbs.Request,
 *   !proto.anytype.Rpc.Block.SetBreadcrumbs.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetBreadcrumbs = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetBreadcrumbs',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.SetBreadcrumbs.Request,
  pb_protos_commands_pb.Rpc.Block.SetBreadcrumbs.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.SetBreadcrumbs.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.SetBreadcrumbs.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.SetBreadcrumbs.Request,
 *   !proto.anytype.Rpc.Block.SetBreadcrumbs.Response>}
 */
const methodInfo_ClientCommands_BlockSetBreadcrumbs = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.SetBreadcrumbs.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.SetBreadcrumbs.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.SetBreadcrumbs.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.SetBreadcrumbs.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.SetBreadcrumbs.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.SetBreadcrumbs.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetBreadcrumbs =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetBreadcrumbs',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetBreadcrumbs,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.SetBreadcrumbs.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.SetBreadcrumbs.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetBreadcrumbs =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetBreadcrumbs',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetBreadcrumbs);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Create.Request,
 *   !proto.anytype.Rpc.Block.Create.Response>}
 */
const methodDescriptor_ClientCommands_BlockCreate = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockCreate',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Create.Request,
  pb_protos_commands_pb.Rpc.Block.Create.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Create.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Create.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Create.Request,
 *   !proto.anytype.Rpc.Block.Create.Response>}
 */
const methodInfo_ClientCommands_BlockCreate = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Create.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Create.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Create.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Create.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Create.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Create.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockCreate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCreate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCreate,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Create.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Create.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockCreate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCreate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCreate);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.CreatePage.Request,
 *   !proto.anytype.Rpc.Block.CreatePage.Response>}
 */
const methodDescriptor_ClientCommands_BlockCreatePage = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockCreatePage',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.CreatePage.Request,
  pb_protos_commands_pb.Rpc.Block.CreatePage.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.CreatePage.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.CreatePage.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.CreatePage.Request,
 *   !proto.anytype.Rpc.Block.CreatePage.Response>}
 */
const methodInfo_ClientCommands_BlockCreatePage = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.CreatePage.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.CreatePage.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.CreatePage.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.CreatePage.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.CreatePage.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.CreatePage.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockCreatePage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCreatePage',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCreatePage,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.CreatePage.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.CreatePage.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockCreatePage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCreatePage',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCreatePage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Unlink.Request,
 *   !proto.anytype.Rpc.Block.Unlink.Response>}
 */
const methodDescriptor_ClientCommands_BlockUnlink = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockUnlink',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Unlink.Request,
  pb_protos_commands_pb.Rpc.Block.Unlink.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Unlink.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Unlink.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Unlink.Request,
 *   !proto.anytype.Rpc.Block.Unlink.Response>}
 */
const methodInfo_ClientCommands_BlockUnlink = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Unlink.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Unlink.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Unlink.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Unlink.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Unlink.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Unlink.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockUnlink =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockUnlink',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockUnlink,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Unlink.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Unlink.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockUnlink =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockUnlink',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockUnlink);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Close.Request,
 *   !proto.anytype.Rpc.Block.Close.Response>}
 */
const methodDescriptor_ClientCommands_BlockClose = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockClose',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Close.Request,
  pb_protos_commands_pb.Rpc.Block.Close.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Close.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Close.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Close.Request,
 *   !proto.anytype.Rpc.Block.Close.Response>}
 */
const methodInfo_ClientCommands_BlockClose = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Close.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Close.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Close.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Close.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Close.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Close.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockClose =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockClose',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockClose,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Close.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Close.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockClose =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockClose',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockClose);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Download.Request,
 *   !proto.anytype.Rpc.Block.Download.Response>}
 */
const methodDescriptor_ClientCommands_BlockDownload = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockDownload',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Download.Request,
  pb_protos_commands_pb.Rpc.Block.Download.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Download.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Download.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Download.Request,
 *   !proto.anytype.Rpc.Block.Download.Response>}
 */
const methodInfo_ClientCommands_BlockDownload = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Download.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Download.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Download.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Download.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Download.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Download.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockDownload =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockDownload',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockDownload,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Download.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Download.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockDownload =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockDownload',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockDownload);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Get.Marks.Request,
 *   !proto.anytype.Rpc.Block.Get.Marks.Response>}
 */
const methodDescriptor_ClientCommands_BlockGetMarks = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockGetMarks',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Get.Marks.Request,
  pb_protos_commands_pb.Rpc.Block.Get.Marks.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Get.Marks.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Get.Marks.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Get.Marks.Request,
 *   !proto.anytype.Rpc.Block.Get.Marks.Response>}
 */
const methodInfo_ClientCommands_BlockGetMarks = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Get.Marks.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Get.Marks.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Get.Marks.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Get.Marks.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Get.Marks.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Get.Marks.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockGetMarks =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockGetMarks',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockGetMarks,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Get.Marks.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Get.Marks.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockGetMarks =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockGetMarks',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockGetMarks);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Undo.Request,
 *   !proto.anytype.Rpc.Block.Undo.Response>}
 */
const methodDescriptor_ClientCommands_BlockUndo = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockUndo',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Undo.Request,
  pb_protos_commands_pb.Rpc.Block.Undo.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Undo.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Undo.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Undo.Request,
 *   !proto.anytype.Rpc.Block.Undo.Response>}
 */
const methodInfo_ClientCommands_BlockUndo = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Undo.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Undo.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Undo.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Undo.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Undo.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Undo.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockUndo =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockUndo',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockUndo,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Undo.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Undo.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockUndo =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockUndo',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockUndo);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Redo.Request,
 *   !proto.anytype.Rpc.Block.Redo.Response>}
 */
const methodDescriptor_ClientCommands_BlockRedo = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockRedo',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Redo.Request,
  pb_protos_commands_pb.Rpc.Block.Redo.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Redo.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Redo.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Redo.Request,
 *   !proto.anytype.Rpc.Block.Redo.Response>}
 */
const methodInfo_ClientCommands_BlockRedo = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Redo.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Redo.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Redo.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Redo.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Redo.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Redo.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockRedo =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockRedo',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockRedo,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Redo.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Redo.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockRedo =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockRedo',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockRedo);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Fields.Request,
 *   !proto.anytype.Rpc.Block.Set.Fields.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetFields = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetFields',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Fields.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Fields.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Fields.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Fields.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Fields.Request,
 *   !proto.anytype.Rpc.Block.Set.Fields.Response>}
 */
const methodInfo_ClientCommands_BlockSetFields = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Fields.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Fields.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Fields.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Fields.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Fields.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Fields.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetFields =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetFields',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetFields,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Fields.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Fields.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetFields =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetFields',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetFields);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Restrictions.Request,
 *   !proto.anytype.Rpc.Block.Set.Restrictions.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetRestrictions = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetRestrictions',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Restrictions.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Restrictions.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Restrictions.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Restrictions.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Restrictions.Request,
 *   !proto.anytype.Rpc.Block.Set.Restrictions.Response>}
 */
const methodInfo_ClientCommands_BlockSetRestrictions = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Restrictions.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Restrictions.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Restrictions.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Restrictions.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Restrictions.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Restrictions.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetRestrictions =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetRestrictions',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetRestrictions,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Restrictions.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Restrictions.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetRestrictions =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetRestrictions',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetRestrictions);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Details.Request,
 *   !proto.anytype.Rpc.Block.Set.Details.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetDetails = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetDetails',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Details.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Details.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Details.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Details.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Details.Request,
 *   !proto.anytype.Rpc.Block.Set.Details.Response>}
 */
const methodInfo_ClientCommands_BlockSetDetails = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Details.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Details.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Details.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Details.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Details.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Details.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetDetails =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetDetails',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetDetails,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Details.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Details.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetDetails =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetDetails',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetDetails);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Page.IsArchived.Request,
 *   !proto.anytype.Rpc.Block.Set.Page.IsArchived.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetPageIsArchived = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetPageIsArchived',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Page.IsArchived.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Page.IsArchived.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Page.IsArchived.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Page.IsArchived.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Page.IsArchived.Request,
 *   !proto.anytype.Rpc.Block.Set.Page.IsArchived.Response>}
 */
const methodInfo_ClientCommands_BlockSetPageIsArchived = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Page.IsArchived.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Page.IsArchived.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Page.IsArchived.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Page.IsArchived.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Page.IsArchived.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Page.IsArchived.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetPageIsArchived =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetPageIsArchived',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetPageIsArchived,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Page.IsArchived.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Page.IsArchived.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetPageIsArchived =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetPageIsArchived',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetPageIsArchived);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Move.Request,
 *   !proto.anytype.Rpc.BlockList.Move.Response>}
 */
const methodDescriptor_ClientCommands_BlockListMove = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListMove',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Move.Request,
  pb_protos_commands_pb.Rpc.BlockList.Move.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Move.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Move.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Move.Request,
 *   !proto.anytype.Rpc.BlockList.Move.Response>}
 */
const methodInfo_ClientCommands_BlockListMove = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Move.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Move.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Move.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Move.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Move.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Move.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListMove =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListMove',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListMove,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Move.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Move.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListMove =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListMove',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListMove);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.MoveToNewPage.Request,
 *   !proto.anytype.Rpc.BlockList.MoveToNewPage.Response>}
 */
const methodDescriptor_ClientCommands_BlockListMoveToNewPage = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListMoveToNewPage',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.MoveToNewPage.Request,
  pb_protos_commands_pb.Rpc.BlockList.MoveToNewPage.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.MoveToNewPage.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.MoveToNewPage.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.MoveToNewPage.Request,
 *   !proto.anytype.Rpc.BlockList.MoveToNewPage.Response>}
 */
const methodInfo_ClientCommands_BlockListMoveToNewPage = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.MoveToNewPage.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.MoveToNewPage.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.MoveToNewPage.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.MoveToNewPage.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.MoveToNewPage.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.MoveToNewPage.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListMoveToNewPage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListMoveToNewPage',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListMoveToNewPage,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.MoveToNewPage.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.MoveToNewPage.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListMoveToNewPage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListMoveToNewPage',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListMoveToNewPage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Request,
 *   !proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Response>}
 */
const methodDescriptor_ClientCommands_BlockListConvertChildrenToPages = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListConvertChildrenToPages',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.ConvertChildrenToPages.Request,
  pb_protos_commands_pb.Rpc.BlockList.ConvertChildrenToPages.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.ConvertChildrenToPages.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Request,
 *   !proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Response>}
 */
const methodInfo_ClientCommands_BlockListConvertChildrenToPages = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.ConvertChildrenToPages.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.ConvertChildrenToPages.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListConvertChildrenToPages =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListConvertChildrenToPages',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListConvertChildrenToPages,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.ConvertChildrenToPages.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListConvertChildrenToPages =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListConvertChildrenToPages',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListConvertChildrenToPages);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.Fields.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Fields.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetFields = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetFields',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.Fields.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.Fields.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Fields.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Fields.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.Fields.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Fields.Response>}
 */
const methodInfo_ClientCommands_BlockListSetFields = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.Fields.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Fields.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Fields.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Fields.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.Fields.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.Fields.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetFields =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetFields',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetFields,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Fields.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.Fields.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetFields =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetFields',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetFields);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.Text.Style.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Text.Style.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetTextStyle = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetTextStyle',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Style.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Style.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Text.Style.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Style.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.Text.Style.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Text.Style.Response>}
 */
const methodInfo_ClientCommands_BlockListSetTextStyle = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Style.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Text.Style.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Style.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Text.Style.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.Text.Style.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.Text.Style.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetTextStyle =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetTextStyle',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetTextStyle,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Text.Style.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.Text.Style.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetTextStyle =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetTextStyle',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetTextStyle);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Duplicate.Request,
 *   !proto.anytype.Rpc.BlockList.Duplicate.Response>}
 */
const methodDescriptor_ClientCommands_BlockListDuplicate = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListDuplicate',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Duplicate.Request,
  pb_protos_commands_pb.Rpc.BlockList.Duplicate.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Duplicate.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Duplicate.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Duplicate.Request,
 *   !proto.anytype.Rpc.BlockList.Duplicate.Response>}
 */
const methodInfo_ClientCommands_BlockListDuplicate = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Duplicate.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Duplicate.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Duplicate.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Duplicate.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Duplicate.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Duplicate.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListDuplicate =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListDuplicate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListDuplicate,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Duplicate.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Duplicate.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListDuplicate =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListDuplicate',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListDuplicate);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.BackgroundColor.Request,
 *   !proto.anytype.Rpc.BlockList.Set.BackgroundColor.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetBackgroundColor = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetBackgroundColor',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.BackgroundColor.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.BackgroundColor.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.BackgroundColor.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.BackgroundColor.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.BackgroundColor.Request,
 *   !proto.anytype.Rpc.BlockList.Set.BackgroundColor.Response>}
 */
const methodInfo_ClientCommands_BlockListSetBackgroundColor = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.BackgroundColor.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.BackgroundColor.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.BackgroundColor.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.BackgroundColor.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.BackgroundColor.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.BackgroundColor.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetBackgroundColor =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetBackgroundColor',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetBackgroundColor,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.BackgroundColor.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.BackgroundColor.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetBackgroundColor =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetBackgroundColor',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetBackgroundColor);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.Align.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Align.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetAlign = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetAlign',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.Align.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.Align.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Align.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Align.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.Align.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Align.Response>}
 */
const methodInfo_ClientCommands_BlockListSetAlign = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.Align.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Align.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Align.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Align.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.Align.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.Align.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetAlign =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetAlign',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetAlign,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Align.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.Align.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetAlign =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetAlign',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetAlign);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.Div.Style.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Div.Style.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetDivStyle = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetDivStyle',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.Div.Style.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.Div.Style.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Div.Style.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Div.Style.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.Div.Style.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Div.Style.Response>}
 */
const methodInfo_ClientCommands_BlockListSetDivStyle = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.Div.Style.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Div.Style.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Div.Style.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Div.Style.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.Div.Style.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.Div.Style.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetDivStyle =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetDivStyle',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetDivStyle,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Div.Style.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.Div.Style.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetDivStyle =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetDivStyle',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetDivStyle);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetPageIsArchived = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetPageIsArchived',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.Page.IsArchived.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.Page.IsArchived.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Page.IsArchived.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Response>}
 */
const methodInfo_ClientCommands_BlockListSetPageIsArchived = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.Page.IsArchived.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Page.IsArchived.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetPageIsArchived =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetPageIsArchived',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetPageIsArchived,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.Page.IsArchived.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetPageIsArchived =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetPageIsArchived',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetPageIsArchived);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Delete.Page.Request,
 *   !proto.anytype.Rpc.BlockList.Delete.Page.Response>}
 */
const methodDescriptor_ClientCommands_BlockListDeletePage = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListDeletePage',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Delete.Page.Request,
  pb_protos_commands_pb.Rpc.BlockList.Delete.Page.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Delete.Page.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Delete.Page.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Delete.Page.Request,
 *   !proto.anytype.Rpc.BlockList.Delete.Page.Response>}
 */
const methodInfo_ClientCommands_BlockListDeletePage = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Delete.Page.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Delete.Page.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Delete.Page.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Delete.Page.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Delete.Page.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Delete.Page.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListDeletePage =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListDeletePage',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListDeletePage,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Delete.Page.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Delete.Page.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListDeletePage =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListDeletePage',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListDeletePage);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Text.Text.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Text.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetTextText = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetTextText',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Text.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Text.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Text.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Text.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Text.Text.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Text.Response>}
 */
const methodInfo_ClientCommands_BlockSetTextText = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Text.Text.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Text.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Text.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Text.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Text.Text.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Text.Text.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetTextText =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextText',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextText,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Text.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Text.Text.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetTextText =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextText',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextText);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Text.Color.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Color.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetTextColor = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetTextColor',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Color.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Color.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Color.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Color.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Text.Color.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Color.Response>}
 */
const methodInfo_ClientCommands_BlockSetTextColor = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Text.Color.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Color.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Color.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Color.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Text.Color.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Text.Color.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetTextColor =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextColor',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextColor,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Color.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Text.Color.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetTextColor =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextColor',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextColor);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.Text.Color.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Text.Color.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetTextColor = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetTextColor',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Color.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Color.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Text.Color.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Color.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.Text.Color.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Text.Color.Response>}
 */
const methodInfo_ClientCommands_BlockListSetTextColor = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Color.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Text.Color.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Color.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Text.Color.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.Text.Color.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.Text.Color.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetTextColor =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetTextColor',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetTextColor,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Text.Color.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.Text.Color.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetTextColor =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetTextColor',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetTextColor);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.BlockList.Set.Text.Mark.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Text.Mark.Response>}
 */
const methodDescriptor_ClientCommands_BlockListSetTextMark = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockListSetTextMark',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Mark.Request,
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Mark.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Text.Mark.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Mark.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.BlockList.Set.Text.Mark.Request,
 *   !proto.anytype.Rpc.BlockList.Set.Text.Mark.Response>}
 */
const methodInfo_ClientCommands_BlockListSetTextMark = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Mark.Response,
  /**
   * @param {!proto.anytype.Rpc.BlockList.Set.Text.Mark.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.BlockList.Set.Text.Mark.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Text.Mark.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.BlockList.Set.Text.Mark.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.BlockList.Set.Text.Mark.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockListSetTextMark =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetTextMark',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetTextMark,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.BlockList.Set.Text.Mark.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.BlockList.Set.Text.Mark.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockListSetTextMark =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockListSetTextMark',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockListSetTextMark);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Text.Style.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Style.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetTextStyle = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetTextStyle',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Style.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Style.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Style.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Style.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Text.Style.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Style.Response>}
 */
const methodInfo_ClientCommands_BlockSetTextStyle = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Text.Style.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Style.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Style.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Style.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Text.Style.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Text.Style.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetTextStyle =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextStyle',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextStyle,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Style.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Text.Style.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetTextStyle =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextStyle',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextStyle);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Text.Checked.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Checked.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetTextChecked = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetTextChecked',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Checked.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Text.Checked.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Checked.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Checked.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Text.Checked.Request,
 *   !proto.anytype.Rpc.Block.Set.Text.Checked.Response>}
 */
const methodInfo_ClientCommands_BlockSetTextChecked = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Text.Checked.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Text.Checked.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Text.Checked.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Checked.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Text.Checked.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Text.Checked.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetTextChecked =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextChecked',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextChecked,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Text.Checked.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Text.Checked.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetTextChecked =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetTextChecked',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetTextChecked);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Split.Request,
 *   !proto.anytype.Rpc.Block.Split.Response>}
 */
const methodDescriptor_ClientCommands_BlockSplit = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSplit',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Split.Request,
  pb_protos_commands_pb.Rpc.Block.Split.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Split.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Split.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Split.Request,
 *   !proto.anytype.Rpc.Block.Split.Response>}
 */
const methodInfo_ClientCommands_BlockSplit = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Split.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Split.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Split.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Split.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Split.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Split.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSplit =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSplit',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSplit,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Split.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Split.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSplit =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSplit',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSplit);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Merge.Request,
 *   !proto.anytype.Rpc.Block.Merge.Response>}
 */
const methodDescriptor_ClientCommands_BlockMerge = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockMerge',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Merge.Request,
  pb_protos_commands_pb.Rpc.Block.Merge.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Merge.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Merge.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Merge.Request,
 *   !proto.anytype.Rpc.Block.Merge.Response>}
 */
const methodInfo_ClientCommands_BlockMerge = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Merge.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Merge.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Merge.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Merge.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Merge.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Merge.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockMerge =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockMerge',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockMerge,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Merge.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Merge.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockMerge =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockMerge',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockMerge);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Copy.Request,
 *   !proto.anytype.Rpc.Block.Copy.Response>}
 */
const methodDescriptor_ClientCommands_BlockCopy = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockCopy',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Copy.Request,
  pb_protos_commands_pb.Rpc.Block.Copy.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Copy.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Copy.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Copy.Request,
 *   !proto.anytype.Rpc.Block.Copy.Response>}
 */
const methodInfo_ClientCommands_BlockCopy = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Copy.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Copy.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Copy.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Copy.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Copy.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Copy.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockCopy =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCopy',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCopy,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Copy.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Copy.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockCopy =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCopy',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCopy);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Paste.Request,
 *   !proto.anytype.Rpc.Block.Paste.Response>}
 */
const methodDescriptor_ClientCommands_BlockPaste = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockPaste',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Paste.Request,
  pb_protos_commands_pb.Rpc.Block.Paste.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Paste.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Paste.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Paste.Request,
 *   !proto.anytype.Rpc.Block.Paste.Response>}
 */
const methodInfo_ClientCommands_BlockPaste = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Paste.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Paste.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Paste.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Paste.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Paste.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Paste.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockPaste =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockPaste',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockPaste,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Paste.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Paste.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockPaste =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockPaste',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockPaste);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Cut.Request,
 *   !proto.anytype.Rpc.Block.Cut.Response>}
 */
const methodDescriptor_ClientCommands_BlockCut = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockCut',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Cut.Request,
  pb_protos_commands_pb.Rpc.Block.Cut.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Cut.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Cut.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Cut.Request,
 *   !proto.anytype.Rpc.Block.Cut.Response>}
 */
const methodInfo_ClientCommands_BlockCut = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Cut.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Cut.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Cut.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Cut.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Cut.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Cut.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockCut =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCut',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCut,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Cut.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Cut.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockCut =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCut',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCut);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Export.Request,
 *   !proto.anytype.Rpc.Block.Export.Response>}
 */
const methodDescriptor_ClientCommands_BlockExport = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockExport',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Export.Request,
  pb_protos_commands_pb.Rpc.Block.Export.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Export.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Export.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Export.Request,
 *   !proto.anytype.Rpc.Block.Export.Response>}
 */
const methodInfo_ClientCommands_BlockExport = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Export.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Export.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Export.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Export.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Export.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Export.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockExport =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockExport',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockExport,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Export.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Export.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockExport =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockExport',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockExport);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.ImportMarkdown.Request,
 *   !proto.anytype.Rpc.Block.ImportMarkdown.Response>}
 */
const methodDescriptor_ClientCommands_BlockImportMarkdown = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockImportMarkdown',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.ImportMarkdown.Request,
  pb_protos_commands_pb.Rpc.Block.ImportMarkdown.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.ImportMarkdown.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.ImportMarkdown.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.ImportMarkdown.Request,
 *   !proto.anytype.Rpc.Block.ImportMarkdown.Response>}
 */
const methodInfo_ClientCommands_BlockImportMarkdown = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.ImportMarkdown.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.ImportMarkdown.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.ImportMarkdown.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.ImportMarkdown.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.ImportMarkdown.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.ImportMarkdown.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockImportMarkdown =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockImportMarkdown',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockImportMarkdown,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.ImportMarkdown.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.ImportMarkdown.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockImportMarkdown =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockImportMarkdown',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockImportMarkdown);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.File.Name.Request,
 *   !proto.anytype.Rpc.Block.Set.File.Name.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetFileName = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetFileName',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.File.Name.Request,
  pb_protos_commands_pb.Rpc.Block.Set.File.Name.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.File.Name.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.File.Name.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.File.Name.Request,
 *   !proto.anytype.Rpc.Block.Set.File.Name.Response>}
 */
const methodInfo_ClientCommands_BlockSetFileName = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.File.Name.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.File.Name.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.File.Name.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.File.Name.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.File.Name.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.File.Name.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetFileName =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetFileName',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetFileName,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.File.Name.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.File.Name.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetFileName =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetFileName',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetFileName);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Image.Name.Request,
 *   !proto.anytype.Rpc.Block.Set.Image.Name.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetImageName = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetImageName',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Image.Name.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Image.Name.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Image.Name.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Image.Name.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Image.Name.Request,
 *   !proto.anytype.Rpc.Block.Set.Image.Name.Response>}
 */
const methodInfo_ClientCommands_BlockSetImageName = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Image.Name.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Image.Name.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Image.Name.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Image.Name.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Image.Name.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Image.Name.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetImageName =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetImageName',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetImageName,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Image.Name.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Image.Name.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetImageName =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetImageName',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetImageName);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Image.Width.Request,
 *   !proto.anytype.Rpc.Block.Set.Image.Width.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetImageWidth = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetImageWidth',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Image.Width.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Image.Width.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Image.Width.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Image.Width.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Image.Width.Request,
 *   !proto.anytype.Rpc.Block.Set.Image.Width.Response>}
 */
const methodInfo_ClientCommands_BlockSetImageWidth = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Image.Width.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Image.Width.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Image.Width.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Image.Width.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Image.Width.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Image.Width.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetImageWidth =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetImageWidth',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetImageWidth,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Image.Width.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Image.Width.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetImageWidth =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetImageWidth',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetImageWidth);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Video.Name.Request,
 *   !proto.anytype.Rpc.Block.Set.Video.Name.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetVideoName = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetVideoName',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Video.Name.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Video.Name.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Video.Name.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Video.Name.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Video.Name.Request,
 *   !proto.anytype.Rpc.Block.Set.Video.Name.Response>}
 */
const methodInfo_ClientCommands_BlockSetVideoName = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Video.Name.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Video.Name.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Video.Name.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Video.Name.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Video.Name.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Video.Name.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetVideoName =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetVideoName',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetVideoName,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Video.Name.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Video.Name.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetVideoName =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetVideoName',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetVideoName);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Video.Width.Request,
 *   !proto.anytype.Rpc.Block.Set.Video.Width.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetVideoWidth = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetVideoWidth',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Video.Width.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Video.Width.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Video.Width.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Video.Width.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Video.Width.Request,
 *   !proto.anytype.Rpc.Block.Set.Video.Width.Response>}
 */
const methodInfo_ClientCommands_BlockSetVideoWidth = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Video.Width.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Video.Width.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Video.Width.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Video.Width.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Video.Width.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Video.Width.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetVideoWidth =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetVideoWidth',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetVideoWidth,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Video.Width.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Video.Width.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetVideoWidth =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetVideoWidth',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetVideoWidth);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Request,
 *   !proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetLinkTargetBlockId = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetLinkTargetBlockId',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Link.TargetBlockId.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Link.TargetBlockId.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Link.TargetBlockId.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Request,
 *   !proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Response>}
 */
const methodInfo_ClientCommands_BlockSetLinkTargetBlockId = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Link.TargetBlockId.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Link.TargetBlockId.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetLinkTargetBlockId =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetLinkTargetBlockId',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetLinkTargetBlockId,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Link.TargetBlockId.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetLinkTargetBlockId =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetLinkTargetBlockId',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetLinkTargetBlockId);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Dataview.View.Request,
 *   !proto.anytype.Rpc.Block.Set.Dataview.View.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetDataviewView = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetDataviewView',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.View.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.View.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Dataview.View.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.View.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Dataview.View.Request,
 *   !proto.anytype.Rpc.Block.Set.Dataview.View.Response>}
 */
const methodInfo_ClientCommands_BlockSetDataviewView = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.View.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Dataview.View.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.View.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Dataview.View.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Dataview.View.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Dataview.View.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetDataviewView =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetDataviewView',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetDataviewView,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Dataview.View.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Dataview.View.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetDataviewView =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetDataviewView',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetDataviewView);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Request,
 *   !proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Response>}
 */
const methodDescriptor_ClientCommands_BlockSetDataviewActiveView = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockSetDataviewActiveView',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.ActiveView.Request,
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.ActiveView.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.ActiveView.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Request,
 *   !proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Response>}
 */
const methodInfo_ClientCommands_BlockSetDataviewActiveView = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.ActiveView.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Set.Dataview.ActiveView.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockSetDataviewActiveView =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetDataviewActiveView',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetDataviewActiveView,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Set.Dataview.ActiveView.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockSetDataviewActiveView =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockSetDataviewActiveView',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockSetDataviewActiveView);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Create.Dataview.View.Request,
 *   !proto.anytype.Rpc.Block.Create.Dataview.View.Response>}
 */
const methodDescriptor_ClientCommands_BlockCreateDataviewView = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockCreateDataviewView',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Create.Dataview.View.Request,
  pb_protos_commands_pb.Rpc.Block.Create.Dataview.View.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Create.Dataview.View.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Create.Dataview.View.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Create.Dataview.View.Request,
 *   !proto.anytype.Rpc.Block.Create.Dataview.View.Response>}
 */
const methodInfo_ClientCommands_BlockCreateDataviewView = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Create.Dataview.View.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Create.Dataview.View.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Create.Dataview.View.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Create.Dataview.View.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Create.Dataview.View.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Create.Dataview.View.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockCreateDataviewView =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCreateDataviewView',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCreateDataviewView,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Create.Dataview.View.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Create.Dataview.View.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockCreateDataviewView =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockCreateDataviewView',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockCreateDataviewView);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Bookmark.Fetch.Request,
 *   !proto.anytype.Rpc.Block.Bookmark.Fetch.Response>}
 */
const methodDescriptor_ClientCommands_BlockBookmarkFetch = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockBookmarkFetch',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Bookmark.Fetch.Request,
  pb_protos_commands_pb.Rpc.Block.Bookmark.Fetch.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Bookmark.Fetch.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Bookmark.Fetch.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Bookmark.Fetch.Request,
 *   !proto.anytype.Rpc.Block.Bookmark.Fetch.Response>}
 */
const methodInfo_ClientCommands_BlockBookmarkFetch = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Bookmark.Fetch.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Bookmark.Fetch.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Bookmark.Fetch.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Bookmark.Fetch.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Bookmark.Fetch.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Bookmark.Fetch.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockBookmarkFetch =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockBookmarkFetch',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockBookmarkFetch,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Bookmark.Fetch.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Bookmark.Fetch.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockBookmarkFetch =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockBookmarkFetch',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockBookmarkFetch);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Request,
 *   !proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Response>}
 */
const methodDescriptor_ClientCommands_BlockBookmarkCreateAndFetch = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockBookmarkCreateAndFetch',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.Bookmark.CreateAndFetch.Request,
  pb_protos_commands_pb.Rpc.Block.Bookmark.CreateAndFetch.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Bookmark.CreateAndFetch.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Request,
 *   !proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Response>}
 */
const methodInfo_ClientCommands_BlockBookmarkCreateAndFetch = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.Bookmark.CreateAndFetch.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.Bookmark.CreateAndFetch.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockBookmarkCreateAndFetch =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockBookmarkCreateAndFetch',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockBookmarkCreateAndFetch,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.Bookmark.CreateAndFetch.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockBookmarkCreateAndFetch =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockBookmarkCreateAndFetch',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockBookmarkCreateAndFetch);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Block.File.CreateAndUpload.Request,
 *   !proto.anytype.Rpc.Block.File.CreateAndUpload.Response>}
 */
const methodDescriptor_ClientCommands_BlockFileCreateAndUpload = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/BlockFileCreateAndUpload',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Block.File.CreateAndUpload.Request,
  pb_protos_commands_pb.Rpc.Block.File.CreateAndUpload.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.File.CreateAndUpload.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.File.CreateAndUpload.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Block.File.CreateAndUpload.Request,
 *   !proto.anytype.Rpc.Block.File.CreateAndUpload.Response>}
 */
const methodInfo_ClientCommands_BlockFileCreateAndUpload = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Block.File.CreateAndUpload.Response,
  /**
   * @param {!proto.anytype.Rpc.Block.File.CreateAndUpload.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Block.File.CreateAndUpload.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Block.File.CreateAndUpload.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Block.File.CreateAndUpload.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Block.File.CreateAndUpload.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.blockFileCreateAndUpload =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/BlockFileCreateAndUpload',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockFileCreateAndUpload,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Block.File.CreateAndUpload.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Block.File.CreateAndUpload.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.blockFileCreateAndUpload =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/BlockFileCreateAndUpload',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_BlockFileCreateAndUpload);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Navigation.ListPages.Request,
 *   !proto.anytype.Rpc.Navigation.ListPages.Response>}
 */
const methodDescriptor_ClientCommands_NavigationListPages = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/NavigationListPages',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Navigation.ListPages.Request,
  pb_protos_commands_pb.Rpc.Navigation.ListPages.Response,
  /**
   * @param {!proto.anytype.Rpc.Navigation.ListPages.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Navigation.ListPages.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Navigation.ListPages.Request,
 *   !proto.anytype.Rpc.Navigation.ListPages.Response>}
 */
const methodInfo_ClientCommands_NavigationListPages = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Navigation.ListPages.Response,
  /**
   * @param {!proto.anytype.Rpc.Navigation.ListPages.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Navigation.ListPages.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Navigation.ListPages.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Navigation.ListPages.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Navigation.ListPages.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.navigationListPages =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/NavigationListPages',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_NavigationListPages,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Navigation.ListPages.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Navigation.ListPages.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.navigationListPages =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/NavigationListPages',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_NavigationListPages);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Request,
 *   !proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Response>}
 */
const methodDescriptor_ClientCommands_NavigationGetPageInfoWithLinks = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/NavigationGetPageInfoWithLinks',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Navigation.GetPageInfoWithLinks.Request,
  pb_protos_commands_pb.Rpc.Navigation.GetPageInfoWithLinks.Response,
  /**
   * @param {!proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Navigation.GetPageInfoWithLinks.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Request,
 *   !proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Response>}
 */
const methodInfo_ClientCommands_NavigationGetPageInfoWithLinks = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Navigation.GetPageInfoWithLinks.Response,
  /**
   * @param {!proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Navigation.GetPageInfoWithLinks.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.navigationGetPageInfoWithLinks =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/NavigationGetPageInfoWithLinks',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_NavigationGetPageInfoWithLinks,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Navigation.GetPageInfoWithLinks.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.navigationGetPageInfoWithLinks =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/NavigationGetPageInfoWithLinks',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_NavigationGetPageInfoWithLinks);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Ping.Request,
 *   !proto.anytype.Rpc.Ping.Response>}
 */
const methodDescriptor_ClientCommands_Ping = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/Ping',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Ping.Request,
  pb_protos_commands_pb.Rpc.Ping.Response,
  /**
   * @param {!proto.anytype.Rpc.Ping.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Ping.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Ping.Request,
 *   !proto.anytype.Rpc.Ping.Response>}
 */
const methodInfo_ClientCommands_Ping = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Ping.Response,
  /**
   * @param {!proto.anytype.Rpc.Ping.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Ping.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Ping.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Ping.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Ping.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.ping =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/Ping',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_Ping,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Ping.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Ping.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.ping =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/Ping',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_Ping);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Rpc.Process.Cancel.Request,
 *   !proto.anytype.Rpc.Process.Cancel.Response>}
 */
const methodDescriptor_ClientCommands_ProcessCancel = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/ProcessCancel',
  grpc.web.MethodType.UNARY,
  pb_protos_commands_pb.Rpc.Process.Cancel.Request,
  pb_protos_commands_pb.Rpc.Process.Cancel.Response,
  /**
   * @param {!proto.anytype.Rpc.Process.Cancel.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Process.Cancel.Response.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Rpc.Process.Cancel.Request,
 *   !proto.anytype.Rpc.Process.Cancel.Response>}
 */
const methodInfo_ClientCommands_ProcessCancel = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_commands_pb.Rpc.Process.Cancel.Response,
  /**
   * @param {!proto.anytype.Rpc.Process.Cancel.Request} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_commands_pb.Rpc.Process.Cancel.Response.deserializeBinary
);


/**
 * @param {!proto.anytype.Rpc.Process.Cancel.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @param {function(?grpc.web.Error, ?proto.anytype.Rpc.Process.Cancel.Response)}
 *     callback The callback function(error, response)
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Rpc.Process.Cancel.Response>|undefined}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.processCancel =
    function(request, metadata, callback) {
  return this.client_.rpcCall(this.hostname_ +
      '/anytype.ClientCommands/ProcessCancel',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ProcessCancel,
      callback);
};


/**
 * @param {!proto.anytype.Rpc.Process.Cancel.Request} request The
 *     request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!Promise<!proto.anytype.Rpc.Process.Cancel.Response>}
 *     A native promise that resolves to the response
 */
proto.anytype.ClientCommandsPromiseClient.prototype.processCancel =
    function(request, metadata) {
  return this.client_.unaryCall(this.hostname_ +
      '/anytype.ClientCommands/ProcessCancel',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ProcessCancel);
};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.anytype.Empty,
 *   !proto.anytype.Event>}
 */
const methodDescriptor_ClientCommands_ListenEvents = new grpc.web.MethodDescriptor(
  '/anytype.ClientCommands/ListenEvents',
  grpc.web.MethodType.SERVER_STREAMING,
  pb_protos_commands_pb.Empty,
  pb_protos_events_pb.Event,
  /**
   * @param {!proto.anytype.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_events_pb.Event.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.anytype.Empty,
 *   !proto.anytype.Event>}
 */
const methodInfo_ClientCommands_ListenEvents = new grpc.web.AbstractClientBase.MethodInfo(
  pb_protos_events_pb.Event,
  /**
   * @param {!proto.anytype.Empty} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  pb_protos_events_pb.Event.deserializeBinary
);


/**
 * @param {!proto.anytype.Empty} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Event>}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsClient.prototype.listenEvents =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/anytype.ClientCommands/ListenEvents',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ListenEvents);
};


/**
 * @param {!proto.anytype.Empty} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.anytype.Event>}
 *     The XHR Node Readable Stream
 */
proto.anytype.ClientCommandsPromiseClient.prototype.listenEvents =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/anytype.ClientCommands/ListenEvents',
      request,
      metadata || {},
      methodDescriptor_ClientCommands_ListenEvents);
};


module.exports = proto.anytype;

