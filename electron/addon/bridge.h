
typedef void (*proxyFunc) (void*, char*, char*, int);

void ProxyCall(proxyFunc f, void* jsFuncData, char* method, char* data, int data_len);
