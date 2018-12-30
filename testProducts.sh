#!/bin/bash
# jq --version > /dev/null 2>&1
# if [ $? -ne 0 ]; then
# 	echo "Please Install 'jq' https://stedolan.github.io/jq/ to execute this script"
# 	echo
# 	exit 1
# fi
 starttime=$(date +%s)

echo "POST request Enroll on Org1  ..."
echo
ORG1_TOKEN=$(curl -s -X POST \
  http://localhost:4000/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Jim&orgName=org1')
echo $ORG1_TOKEN
ORG1_TOKEN=$(echo $ORG1_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG1 token is $ORG1_TOKEN"
echo
echo

echo "POST request Create channel  ..."
echo
curl -s -X POST \
  http://localhost:4000/channels \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "channelName":"mychannel",
  "channelConfigPath":"../artifacts/channel/mychannel.tx"
}'
echo
echo
sleep 5
echo "POST request Join channel on Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannel/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "peers": ["peer1","peer2"]
}'
echo
echo

echo "POST Install chaincode on Org1"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer1", "peer2"],
	"chaincodeName":"ProductCC",
	"chaincodePath":"github.com/chaincodes/Products",
	"chaincodeVersion":"v1"
}'
echo
echo

echo "POST instantiate chaincode on peer1 of Org1"
echo
curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"chaincodeName":"ProductCC",
	"chaincodeVersion":"v1",
	"args":[]
}'
echo
echo

echo "POST invoke chaincode on peers of Org1"
echo "create a Product...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ProductCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"fcn":"createProduct",
	"args":["PR1","sup1","EC","IND","100","1000","13/12/2017","tr1","1000", "14/12/2017","MU","15/12/2017","BY","BG","RGT","16/12/2017","cus1","cus1","12/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "Product created successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ProductCC?peer=peer1&fcn=getProductByID&args=%5B%22PR1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "POST invoke chaincode on peers of Org1"
echo "create a Product...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ProductCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"createProduct",
  "args":["PR2","sup2","EC","IND","100","1000","13/12/2017","tr2","1000", "14/12/2017","MU","15/12/2017","BY","BG","RGT","16/12/2017","cus1","cus1","12/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "Product created successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ProductCC?peer=peer1&fcn=getProductByID&args=%5B%22PR2%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "POST invoke chaincode on peers of Org1"
echo "create a Product...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ProductCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"createProduct",
  "args":["PR3","sup2","DR","IND","500","5000","13/12/2017","tr1","1000", "14/12/2017","MU","15/12/2017","BY","BG","RGT","16/12/2017","cus1","cus1","12/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "Product created successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ProductCC?peer=peer1&fcn=getProductByID&args=%5B%22PR2%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "update a Product...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ProductCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateProduct",
  "args":["PR1","sup1","DR","IND","500","5000","13/12/2017","tr1","1000", "14/12/2017","MU","15/12/2017","BY","BG","RGT","16/2017","cus1","cus1","12/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "updated the Product successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ProductCC?peer=peer1&fcn=getProductByID&args=%5B%22PR1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "getting All Products...."
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ProductCC?peer=peer1&fcn=getAllProducts&args=%5B%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo "Fetched All Products...."
echo

echo "deleting a Product...."
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ProductCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"deleteProduct",
  "args":["PR3"]
}')
echo "Transacton ID is $TRX_ID"
echo "deleted a Product"
echo
echo

echo "GET query chaincode on peer1 of Org1"
echo "Fetching a deleted Product by PRID"
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ProductCC?peer=peer1&fcn=getProductByID&args=%5B%22PR3%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
