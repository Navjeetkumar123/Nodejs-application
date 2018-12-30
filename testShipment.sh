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

echo "POST Install chaincode on Org1"
echo
curl -s -X POST \
  http://localhost:4000/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer1", "peer2"],
	"chaincodeName":"ShipmentCC",
	"chaincodePath":"github.com/chaincodes/Shipments",
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
	"chaincodeName":"ShipmentCC",
	"chaincodeVersion":"v1",
	"args":[]
}'
echo
echo

echo "POST invoke chaincode on peers of Org1"
echo "create Shipment...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"fcn":"createShipment",
	"args":["SH1","CT1","500","uni1","18/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "Shipment created successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "POST invoke chaincode on peers of Org1"
echo "create Shipment...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"createShipment",
  "args":["SH2","CT1","500","uni1","18/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "Shipment created successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH2%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "supplier status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","N","NA","NA", "N","NA","NA","N","NA","NA","NA","N","NA","N","NA","NA","N","NA","NA","N","NA","NA","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "supplier updated the shipment successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "Container arrival status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","Y","20/12/2017","con1doc", "NA","NA","NA","N","NA","NA","NA","N","NA","N","NA","NA","N","NA","NA","N","NA","NA","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "Container arrival status updated successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "load to ship status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","Y","20/12/2017","con1doc", "Y","21/12/2017","LTS1DOC","N","NA","NA","NA","N","NA","N","NA","NA","N","NA","NA","N","NA","NA","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "load to ship status updated successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "ship arrival status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","Y","20/12/2017","con1doc", "Y","21/12/2017","LTS1DOC","Y","22/12/2017","SAdoc","NA","N","NA","N","NA","NA","N","NA","NA","N","NA","NA","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "ship arrival status updated successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "container offload status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","Y","20/12/2017","con1doc", "Y","21/12/2017","LTS1DOC","Y","22/12/2017","SAdoc","23/12/2017","Y","COdoc","N","NA","NA","N","NA","NA","N","NA","NA","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "container offload status updated successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "bunkering ready status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","Y","20/12/2017","con1doc", "Y","21/12/2017","LTS1DOC","Y","22/12/2017","SAdoc","23/12/2017","Y","COdoc","Y","24/12/2017","BRdoc","N","NA","NA","N","NA","NA","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "bunkering ready status updated successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "bunkering complete status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","Y","20/12/2017","con1doc", "Y","21/12/2017","LTS1DOC","Y","22/12/2017","SAdoc","23/12/2017","Y","COdoc","Y","24/12/2017","BRdoc","Y","25/12/2017","BCdoc","N","NA","NA","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "bunkering complete status updated successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "customer handover status update...."
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"updateShipment",
  "args":["SH1","Y","19/12/2017","Sup1Doc","500","Y","20/12/2017","con1doc", "Y","21/12/2017","LTS1DOC","Y","22/12/2017","SAdoc","23/12/2017","Y","COdoc","Y","24/12/2017","BRdoc","Y","25/12/2017","BCdoc","Y","26/12/2017","cus1Hnddoc","500","CT1","DR1","cus1","tr1","sup1","sup1","19/12/2017"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "customer handover status updated successfully"

echo "GET query chaincode on peer1 of Org1"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo
echo "GET query chaincode on peer1 of Org1"
echo "Getting shipment by user...."
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByUser&args=%5B%22cus1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "Fetched shipment details by user successfully"

echo "GET query chaincode on peer1 of Org1"
echo "Getting shipment by shipment_id"
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo "fetched shipment by shipment_id successfully"

echo "getting All Shipments...."
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getAllShipments&args=%5B%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo "Fetched All Shipments...."
echo

echo "geting Shipment By DRID...."
echo
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByDRID&args=%5B%22DR1%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo

echo "Fetched shipment by DRID"
echo
echo

echo "deleting a Shipment"
echo
TRX_ID=$(curl -s -X POST \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
  "fcn":"deleteShipment",
  "args":["SH2"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo "deleted the Shipment"
echo

echo "GET query chaincode on peer1 of Org1"
echo "Fetching a deleted Shipment"
curl -s -X GET \
  "http://localhost:4000/channels/mychannel/chaincodes/ShipmentCC?peer=peer1&fcn=getShipmentByID&args=%5B%22SH2%22%5D" \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json"
echo
echo "Fetched the deleted Shipment "
echo

echo "Total execution time : $(($(date +%s)-starttime)) secs ..."