
typedef void (*voidFunc) (char*, char*, int);

voidFunc callback;

void setFunc(voidFunc f)
{
	callback = f;
}

void CallFunction(char* method, char* data, int data_len)
{
    callback(method, data, data_len);
}
