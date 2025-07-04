import {AccountInterface, Contract, ContractAddress, ProviderInterface, RpcProvider, shortString} from "starknet";
import {ContractType} from "../types";
import BigNumber from "bignumber.js";
import {toast} from "react-toastify";

export const OWNERSHIP_ADDRESS: ContractAddress = import.meta.env.VITE_OWNERSHIP_ADDRESS || "0x123";
export const AUTHENTICITY_ADDRESS: ContractAddress = import.meta.env.VITE_AUTHENTICITY_ADDRESS || "0x456";

export const PROVIDER = new RpcProvider({
    nodeUrl: import.meta.env.VITE_SEPOLIA_URL || "https://starknet-sepolia.public.blastapi.io"
});

export const getContract = async (
    contractAddress: ContractAddress,
    contractType: ContractType,
    provider: ProviderInterface,
    account?: AccountInterface | null,
    address?: ContractAddress | null
): Promise<Contract> => {
    try {

        const {abi} = await provider.getClassAt(contractAddress);
        if (!abi) {
            throw new Error("No ABI found for the contract.");
        }

        if (contractType === ContractType.VIEW) {
            return new Contract(abi, contractAddress, provider);

        } else if (contractType === ContractType.STATE_CHANGE) {
            if (!address || !account) {
                throw new Error("Account not initialized");
            }
            return new Contract(abi, contractAddress, account);
        }

        throw new Error("Invalid contract type");
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to initialize contract at ${contractAddress}: ${error.message}`);
        } else {
            throw new Error(`Failed to initialize contract at ${contractAddress}: Unknown error`);
        }
    }
};

export const felt252ToString = (felt: string): string => {
    try {
        const bn = BigNumber(felt);
        const hex_it = "0x" + bn.toString(16);
        return shortString.decodeShortString(hex_it);
    } catch (error: any) {
        toast.error(`Error decoding felt252: ${error.message}`);
        return "";
    }
};

export const stringToFelt252 = (str: string): string => {
    return shortString.encodeShortString(str)
};

export const hex_it = (value: string): string => {
    return "0x" + BigNumber(value).toString(16);
};
