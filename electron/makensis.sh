#!/bin/sh

# Name of the script
SCRIPT_NAME=$0

# Temp file for storing the parsed arguments
TEMP_ARG_FILE=$(mktemp)

# Function for displaying the usage
usage() {
    echo "Usage: $SCRIPT_NAME /OUTPUT=outfile.nsi script.nsi"
    exit 1
}

# Make sure at least two arguments have been passed
if [ "$#" -lt 2 ]; then
    usage
fi

echo "Passed arguments: $@"

# Parse the arguments
for i in "$@"
do
    case $i in
        /OUTPUT=*|--output=*)
            OUTFILE="${i#*=}"
            echo $OUTFILE > $TEMP_ARG_FILE
            shift # past argument=value
        ;;
        *)
            # unknown option
        ;;
    esac
done

# Call makensis with the original parameters
makensis "$@"

# If makensis ran successfully, sign the resulting file
if [ "$?" -eq 0 ]; then
    SIGN_FILE=$(cat $TEMP_ARG_FILE)
    if [ -n "$SIGN_FILE" ]; then
		printenv

		AzureSignTool.exe sign \
		-du "https://anytype.io" \
		-fd sha384 \
		-td sha384 \
		-tr http://timestamp.digicert.com \
		--azure-key-vault-url "${AZURE_KEY_VAULT_URI}" \
		--azure-key-vault-client-id "${AZURE_CLIENT_ID}" \
		--azure-key-vault-tenant-id "${AZURE_TENANT_ID}" \
		--azure-key-vault-client-secret "${AZURE_CLIENT_SECRET}" \
		--azure-key-vault-certificate "${AZURE_CERT_NAME}" \
		-v \
		"${SIGN_FILE}" \
    else
        echo "Couldn't find output file. Please make sure to use /OUTPUT= parameter"
    fi
else
    echo "makensis failed. Aborting."
fi

# Cleanup
rm $TEMP_ARG_FILE