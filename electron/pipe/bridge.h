
typedef void (*voidFunc) (char*, char*, int);

void setFunc(voidFunc f);
void CallFunction(char* method, char* data, int data_len);
