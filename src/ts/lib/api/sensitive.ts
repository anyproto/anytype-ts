/**
 * Commands whose request or response carries an API key, a pairing secret or the recovery phrase. They
 * never reach the dispatcher's debug log, and they bypass the gRPC DevTools interceptors (grpc-devtools.ts).
 * WalletCreateSession: its request holds the clipper's appKey (from SolveChallenge) or the mnemonic.
 */
export const SKIP_LOG = [ 'AccountLocalLinkCreateApp', 'AccountLocalLinkListApps', 'AccountLocalLinkSolveChallenge', 'WalletCreateSession' ];

/** The command of a grpc-web method name such as '/anytype.ClientCommands/AccountLocalLinkCreateApp' */
export const commandOf = (methodName: string): string => String(methodName || '').split('/').pop() || '';

export const isSensitiveCommand = (methodName: string): boolean => SKIP_LOG.includes(commandOf(methodName));
