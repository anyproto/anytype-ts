// Type augmentation for grpc-web to include interceptor options
declare module 'grpc-web' {
  interface GrpcWebClientBaseOptions {
    unaryInterceptors?: UnaryInterceptor<any, any>[];
    streamInterceptors?: StreamInterceptor<any, any>[];
  }
}