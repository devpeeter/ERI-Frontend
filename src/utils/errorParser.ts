/**
 * Enhanced error parser for Starknet smart contract errors
 * @param {Error | unknown} error - The error object to parse
 * @returns {string} Human-readable error message
 */
export const parseError = (error: unknown): string => {
    // Extract message with fallbacks
    const message = (
        (error as { data?: { message?: string } })?.data?.message ||
        (error as { error?: { message?: string } })?.error?.message ||
        (error as { reason?: string })?.reason ||
        (error as { message?: string })?.message ||
        "Unknown error"
    )
        .toString()
        .toLowerCase()
        .replace("execution reverted:", "")
        .replace("error:", "")
        .replace("revert:", "")
        .trim();

    const errorMap: Record<string, string> = {
        // Authentication & Registration Errors
        "address zero is not allowed": "Invalid address: Zero address not allowed",
        "username is not available": "This username is already taken. Please choose another one.",
        "manufacturer name is not available": "This manufacturer name is already taken. Please choose another one.",
        "address is already registered": "This wallet address is already registered",
        "name is invalid or too short": "Name must be at least 2 characters long",
        "manufacturer not registered": "Manufacturer must be registered before performing this action",
        "user not registered": "User must be registered before performing this action",
        
        // Signature & Authentication Errors
        "invalid signature": "Invalid signature - authentication failed",
        "signature verification failed": "Signature verification failed - invalid certificate",
        "invalid message hash": "Invalid message hash - certificate data may be corrupted",
        "authenticity not set": "Authenticity contract not configured properly",
        "product is not authentic": "Product authenticity verification failed - this may be a counterfeit item",
        
        // Ownership & Transfer Errors
        "does_not_exist": "Item does not exist yet",
        "item already owned": "This item is onwed by another user",
        "item already claimed": "This item has already been claimed",
        "only owner is allowed": "Only the owner can perform this action",
        "unauthorized caller": "You are not authorized to perform this action",
        "unauthorized claimant": "You are not authorized to claim this item",
        "invalid item id": "Item doesn't exist or invalid item ID",
        "item not found": "The specified item could not be found",
        "cannot generate for yourself": "Cannot generate transfer code for yourself",
        "item not claimed yet": "Cannot generate a new transfer code as item has not been claimed yet",
        "invalid item hash": "Invalid item hash - transfer code may be corrupted",
        "item claim failed": "Failed to claim item ownership",
        "transfer code expired": "Transfer code has expired",
        "transfer code already used": "This transfer code has already been used",
        "no active transfer": "No active transfer found for this item",
        
        // Transaction & Network Errors
        "user rejected transaction": "Transaction was canceled by user",
        "user denied transaction signature": "Transaction signature was denied by user",
        "insufficient funds": "Insufficient funds to complete transaction",
        "insufficient balance": "Insufficient wallet balance for transaction fees",
        "nonce too low": "Network synchronization error - please try again",
        "nonce too high": "Transaction nonce error - please refresh and try again",
        "gas limit exceeded": "Transaction requires more gas than allowed",
        "gas estimation failed": "Unable to estimate gas for transaction",
        "execution reverted": "Transaction was reverted by the smart contract",
        "transaction failed": "Transaction failed to execute",
        "network error": "Network connection error - please check your internet",
        "rpc error": "Network RPC error - please try again later",
        
        // Contract & Data Errors
        "contract not found": "Smart contract not found at specified address",
        "function not found": "Contract function not found",
        "invalid contract address": "Invalid smart contract address",
        "contract execution failed": "Smart contract execution failed",
        "invalid input data": "Invalid input data provided",
        "data encoding error": "Error encoding transaction data",
        "abi parsing error": "Error parsing contract ABI",
        
        // Wallet & Connection Errors
        "wallet not connected": "Please connect your wallet to continue",
        "wallet connection failed": "Failed to connect wallet",
        "account not found": "Wallet account not found",
        "provider not available": "Wallet provider not available",
        "chain mismatch": "Please switch to the correct network",
        "unsupported network": "This network is not supported",
        
        // File & Data Processing Errors
        "csv parsing error": "Error parsing CSV file - please check file format",
        "invalid file format": "Invalid file format - please upload a valid CSV file",
        "file too large": "File size exceeds maximum limit",
        "empty file": "File is empty or contains no valid data",
        "invalid json": "Invalid JSON data format",
        
        // General Application Errors
        "timeout": "Request timed out - please try again",
        "rate limit exceeded": "Too many requests - please wait and try again",
        "service unavailable": "Service temporarily unavailable",
        "maintenance mode": "System is under maintenance - please try again later",
        "invalid request": "Invalid request parameters",
        "permission denied": "Permission denied for this operation",
        "resource not found": "Requested resource not found",
        "conflict": "Resource conflict - operation cannot be completed",
    };

    // Check for specific error patterns
    for (const [key, value] of Object.entries(errorMap)) {
        if (message.includes(key)) {
            return value;
        }
    }

    // Handle Starknet JSON-RPC error codes
    if ((error as { code?: number }).code) {
        switch ((error as { code: number }).code) {
            case 4001:
                return "Transaction rejected by user";
            case 4100:
                return "Unauthorized - please connect your wallet";
            case 4200:
                return "Unsupported method";
            case 4900:
                return "Wallet is disconnected";
            case 4901:
                return "Chain not added to wallet";
            case -32700:
                return "Invalid JSON format";
            case -32600:
                return "Invalid request";
            case -32601:
                return "Method not found";
            case -32602:
                return "Invalid parameters";
            case -32603:
                return "Internal JSON-RPC error";
            case -32000:
                return "Invalid input parameters";
            case -32001:
                return "Resource not found";
            case -32002:
                return "Resource unavailable";
            case -32003:
                return "Transaction rejected";
            case -32004:
                return "Method not supported";
            case -32005:
                return "Request limit exceeded";
            case 40:
                return "Contract error - please check your inputs";
            case 50:
                return "Network congestion - please try again";
            default:
                return `Network error (Code: ${(error as { code: number }).code})`;
        }
    }

    // Handle specific Starknet error patterns
    if (message.includes("felt252")) {
        return "Invalid text format - text may be too long or contain invalid characters";
    }
    
    if (message.includes("cairo")) {
        return "Smart contract execution error - please check your inputs";
    }
    
    if (message.includes("entrypoint")) {
        return "Contract function not found - please contact support";
    }
    
    if (message.includes("calldata")) {
        return "Invalid transaction data - please try again";
    }

    // Handle wallet-specific errors
    if (message.includes("argent") || message.includes("braavos")) {
        return "Wallet error - please check your wallet connection";
    }

    // Handle network-specific errors
    if (message.includes("sepolia") || message.includes("mainnet")) {
        return "Network error - please check your network connection";
    }

    // Clean up common error prefixes and return a more readable message
    const cleanedMessage = message
        .replace(/^error:\s*/i, "")
        .replace(/^revert:\s*/i, "")
        .replace(/^execution reverted:\s*/i, "")
        .replace(/^transaction reverted:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();

    // If the cleaned message is still technical, provide a generic user-friendly message
    if (cleanedMessage.length < 5 || cleanedMessage === "unknown error") {
        return "An unexpected error occurred. Please try again or contact support if the problem persists.";
    }

    // Capitalize first letter and ensure proper sentence structure
    const finalMessage = cleanedMessage.charAt(0).toUpperCase() + cleanedMessage.slice(1);
    
    // Add period if not present
    return finalMessage.endsWith('.') ? finalMessage : `${finalMessage}.`;
};

/**
 * Parse and display error with toast notification
 * @param error - The error to parse and display
 * @param customMessage - Optional custom message prefix
 */
export const handleError = (error: unknown, customMessage?: string): void => {
    const parsedError = parseError(error);
    const finalMessage = customMessage ? `${customMessage}: ${parsedError}` : parsedError;
    
    // Import toast dynamically to avoid circular dependencies
    import('react-toastify').then(({ toast }) => {
        toast.error(finalMessage);
    });
};

/**
 * Log error for debugging while showing user-friendly message
 * @param error - The original error
 * @param context - Context where the error occurred
 */
export const logAndParseError = (error: unknown, context: string): string => {
    // Log the full error for debugging
    console.error(`Error in ${context}:`, error);
    
    // Return user-friendly message
    return parseError(error);
};