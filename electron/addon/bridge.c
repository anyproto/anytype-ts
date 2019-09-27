
typedef void (*proxyFunc) (void* jsFuncData, char* method, char*, int);

void ProxyCall(proxyFunc f, void* jsFuncData, char* method, char* data, int data_len)
{
    f(jsFuncData, method, data, data_len);
}
