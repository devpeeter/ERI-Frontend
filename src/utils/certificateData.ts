import { Certificate } from "../types";

import {
  constants,
  shortString,
  StarknetDomain,
  TypedData,
  typedData,
  TypedDataRevision,
} from "starknet";

const types = {
  StarknetDomain: [
    { name: "name", type: "shortstring" },
    { name: "version", type: "shortstring" },
    { name: "chainId", type: "shortstring" },
    { name: "revision", type: "shortstring" },
  ],

  Certificate: [
    { name: "name", type: "felt" },
    { name: "id", type: "felt" },
    { name: "serial", type: "felt" },
    { name: "date", type: "u128" },
    { name: "owner", type: "ContractAddress" },
    { name: "metadata", type: "felt*" },
  ],
};


function getDomain(): StarknetDomain {
  return {
    name: "Authenticity",
    version: shortString.encodeShortString("1"),
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    revision: TypedDataRevision.ACTIVE,
  };
}

export function getTypedDataHash(myStruct: Certificate, owner: bigint): string {
  console.log("Inside Certificate: ", myStruct);
  return typedData.getMessageHash(getTypedData(myStruct), owner);
}

export function getTypedData(myStruct: Certificate): TypedData {
  return {
    types,
    primaryType: "Certificate",
    domain: getDomain(),
    message: {
      name: myStruct.name,
      id: myStruct.id,
      serial: myStruct.serial,
      date: myStruct.date,
      owner: myStruct.owner,
      metadata: myStruct.metadata,
    },
  };
}


