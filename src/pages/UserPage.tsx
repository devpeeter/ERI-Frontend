import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Key, Shield, Eye, Gift, RotateCcw, AlertCircle, Wallet, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useWallet } from '../contexts/WalletContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { ItemDetails, OwnershipDetails, ContractType } from '../types';
import { getContract, OWNERSHIP_ADDRESS, stringToFelt252, felt252ToString, hex_it } from '../utils/blockchain';
import { handleError } from '../utils/errorParser';

interface UserPageProps {
  activeFeature: string;
}

export const UserPage: React.FC<UserPageProps> = ({ activeFeature }) => {
  const { isDark } = useTheme();
  const { provider, account, address, isConnected, connectWallet } = useWallet();
  const { sendOwnershipTransferNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  
  // Registration state
  const [username, setUsername] = useState('');
  
  // Dashboard state
  const [userItems, setUserItems] = useState<ItemDetails[]>([]);
  const [transferItemId, setTransferItemId] = useState('');
  const [transferToAddress, setTransferToAddress] = useState('');
  const [revokeItemHash, setRevokeItemHash] = useState('');
  const [claimCode, setClaimCode] = useState('');
  
  // Verification state
  const [verifyItemId, setVerifyItemId] = useState('');
  const [ownershipDetails, setOwnershipDetails] = useState<OwnershipDetails | null>(null);

  // Auto-load user items when dashboard is accessed and wallet is connected
  useEffect(() => {
    if ((activeFeature === 'my-items' || activeFeature === '') && isConnected && userItems.length === 0) {
      loadUserItems();
    }
  }, [activeFeature, isConnected]);

  // Clear items when wallet is disconnected
  useEffect(() => {
    if (!isConnected) {
      setUserItems([]);
    }
  }, [isConnected]);

  const requireWalletConnection = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to continue');
      connectWallet();
      return false;
    }
    return true;
  };

  const registerUser = async () => {
    if (!requireWalletConnection()) return;

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);

      console.log("Contract: ", contract);
      
      const res = await contract.user_registers(stringToFelt252(username.toLowerCase().trim()));
      console.log("Result: ", res);
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      const userAddress = events[0]["eri::events::EriEvents::UserRegistered"].user_address;
      const userName = events[0]["eri::events::EriEvents::UserRegistered"].username;

      toast.success(`User ${felt252ToString(userName.toString())} registered successfully!`);
      setUsername('');
    } catch (error: unknown) {
      handleError(error, 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const loadUserItems = async () => {
    if (!requireWalletConnection()) return;

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const result: any[] = await contract.get_all_my_items(address);
      
      const items = result.map((item) => ({
        item_id: felt252ToString(item.item_id),
        name: felt252ToString(item.name),
        owner: hex_it(item.owner),
        serial: felt252ToString(item.serial),
        manufacturer: felt252ToString(item.manufacturer),
        date: new Date(Number(item.date) * 1000).toLocaleString(),
        metadata_hash: hex_it(item.metadata_hash),
      }));

      setUserItems(items);
      if (items.length > 0) {
        toast.success(`Loaded ${items.length} items`);
      }
    } catch (error: unknown) {
      handleError(error, 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const generateTransferCode = async () => {
    if (!requireWalletConnection()) return;

    if (!transferItemId || !transferToAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const res = await contract.generate_change_of_ownership_code(
        stringToFelt252(transferItemId),
        transferToAddress
      );

      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      const ownershipCode = events[0]["eri::events::EriEvents::OwnershipCode"].ownership_code;
      const temp = events[0]["eri::events::EriEvents::OwnershipCode"].temp_owner;

      const transferCode = hex_it(ownershipCode);
      
      // Find the item name for the notification
      const item = userItems.find(item => item.item_id === transferItemId);
      const itemName = item?.name || transferItemId;

      // Send notification to recipient via Supabase
      await sendOwnershipTransferNotification(
        transferToAddress,
        transferItemId,
        itemName,
        address!,
        transferCode
      );

      toast.success(`Transfer code generated and notification sent!`);
      setTransferItemId('');
      setTransferToAddress('');
    } catch (error: unknown) {
      handleError(error, 'Failed to generate transfer code');
    } finally {
      setLoading(false);
    }
  };

  const claimOwnershipWithCode = async () => {
    if (!requireWalletConnection()) return;

    if (!claimCode) {
      toast.error('Please enter claim code');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const feltItemHash = claimCode.startsWith('0x') ? claimCode : '0x' + claimCode;
      
      const res = await contract.new_owner_claim_ownership(feltItemHash);
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      const newOwner = events[0]["eri::events::EriEvents::OwnershipClaimed"].new_owner;
      const oldOwner = events[0]["eri::events::EriEvents::OwnershipClaimed"].old_owner;

      toast.success(`Ownership claimed successfully from ${hex_it(oldOwner.toString())}`);
      setClaimCode('');
      // Refresh items list
      loadUserItems();
    } catch (error: unknown) {
      handleError(error, 'Failed to claim ownership');
    } finally {
      setLoading(false);
    }
  };

  const revokeTransferCode = async () => {
    if (!requireWalletConnection()) return;

    if (!revokeItemHash) {
      toast.error('Please enter item hash');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const feltItemHash = revokeItemHash.startsWith('0x') ? revokeItemHash : '0x' + revokeItemHash;
      
      const res = await contract.owner_revoke_code(feltItemHash);
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);

      toast.success('Transfer code revoked successfully');
      setRevokeItemHash('');
    } catch (error: unknown) {
      handleError(error, 'Failed to revoke code');
    } finally {
      setLoading(false);
    }
  };

  const verifyOwnership = async () => {
    if (!verifyItemId) {
      toast.error('Please enter item ID');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW, provider!, account, address);
      
      const result = await contract.verify_ownership(stringToFelt252(verifyItemId));
      
      const details: OwnershipDetails = {
        name: felt252ToString(result.name),
        item_id: felt252ToString(result.item_id),
        username: felt252ToString(result.username),
        owner: hex_it(result.owner)
      };

      setOwnershipDetails(details);
      toast.success('Ownership details retrieved');
    } catch (error: unknown) {
      handleError(error, 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Show wallet connection prompt if not connected
  if (!isConnected && activeFeature !== 'verify-ownership') {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className={`text-4xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent ${
                isDark 
                  ? 'from-green-400 to-emerald-400' 
                  : 'from-green-600 to-emerald-600'
              }`}>
                User Dashboard
              </h1>
              <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Connect your wallet to access your product ownership dashboard
              </p>
            </div>

            {/* Wallet Connection Card */}
            <Card className="text-center mb-12">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                isDark 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-green-600 to-emerald-700'
              }`}>
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Connect Your Wallet
              </h2>
              <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                To access your dashboard and manage your product ownership, please connect your wallet.
              </p>
              <Button onClick={connectWallet} size="lg">
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
              </Button>
            </Card>

            {/* How It Works for Users */}
            <Card>
              <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                How It Works for Users
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-green-600 to-emerald-700'
                    }`}>
                      1
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Register Your Account
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Create your user account on the blockchain to start managing products
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-green-600 to-emerald-700'
                    }`}>
                      2
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Claim Product Ownership
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Scan QR codes or use transfer codes to claim ownership of authentic products
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-green-600 to-emerald-700'
                    }`}>
                      3
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Manage Your Items
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        View all your owned products and transfer them to others securely
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-green-600 to-emerald-700'
                    }`}>
                      4
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Verify Authenticity
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Use the sidebar features to verify product authenticity and ownership
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-8 p-4 rounded-xl border ${
                isDark 
                  ? 'bg-blue-500/10 border-blue-500/30' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  💡 <strong>Tip:</strong> Once connected, use the sidebar to access all user features including registration, item management, and verification tools.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeFeature) {
      case 'register-user':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <User className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Register as User
              </h2>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Create your user account to manage and verify product ownership
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerUser();
              }}
              className="space-y-6"
            >
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                className="w-full"
              >
                {!isConnected ? 'Connect Wallet to Register' : 'Register User'}
              </Button>
            </form>
          </Card>
        );

      case 'claim-ownership':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className={`text-xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <Package className={`w-6 h-6 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                Claim Ownership
              </h3>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Use a transfer code to claim ownership of an item. Check your notifications for transfer codes sent to you.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                claimOwnershipWithCode();
              }}
              className="space-y-4"
            >
              <Input
                placeholder="Enter transfer code (item hash)"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                className="w-full"
              >
                <Package className="w-4 h-4 mr-2" />
                Claim Ownership
              </Button>
            </form>

            <div className={`mt-6 p-4 rounded-xl border ${
              isDark 
                ? 'bg-blue-500/10 border-blue-500/30' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                💡 <strong>Tip:</strong> When someone transfers ownership to you, you'll receive a notification with the transfer code. Click the notification bell to see pending transfers.
              </p>
            </div>
          </Card>
        );

      case 'transfer-ownership':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className={`text-xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <Gift className={`w-6 h-6 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                Transfer Ownership
              </h3>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Generate a transfer code to gift your item to another user. They will receive an in-app notification.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateTransferCode();
              }}
              className="space-y-4"
            >
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Select Item to Transfer
                </label>
                <select
                  value={transferItemId}
                  onChange={(e) => setTransferItemId(e.target.value)}
                  className={`w-full p-4 rounded-xl border transition-all duration-300 ${
                    isDark 
                      ? 'bg-gray-800/50 border-green-500/20 text-white focus:ring-green-500/50 focus:border-green-500/50' 
                      : 'bg-white/50 border-green-600/20 text-gray-800 focus:ring-green-600/50 focus:border-green-600/50'
                  } focus:outline-none focus:ring-2`}
                  required
                >
                  <option value="">Select an item...</option>
                  {userItems.map((item) => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.name} (ID: {item.item_id})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                placeholder="Recipient wallet address"
                value={transferToAddress}
                onChange={(e) => setTransferToAddress(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                Generate Transfer Code & Send Notification
              </Button>
            </form>

            <div className={`mt-6 p-4 rounded-xl border ${
              isDark 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-green-50 border-green-200'
            }`}>
              <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                ✨ <strong>New:</strong> The recipient will automatically receive an in-app notification with a direct link to claim ownership. No need to manually share codes!
              </p>
            </div>
          </Card>
        );

      case 'revoke-code':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className={`text-xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <RotateCcw className={`w-6 h-6 mr-2 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                Revoke Transfer Code
              </h3>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Cancel a previously generated transfer code
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                revokeTransferCode();
              }}
              className="space-y-4"
            >
              <Input
                placeholder="Item hash of transfer to revoke"
                value={revokeItemHash}
                onChange={(e) => setRevokeItemHash(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                variant="danger"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Revoke Code
              </Button>
            </form>
          </Card>
        );

      case 'verify-ownership':
        return (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <div className="mb-6">
                <Shield className={`w-8 h-8 mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Verify Ownership
                </h2>
                <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Enter an item ID to verify its current ownership details (no wallet required)
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyOwnership();
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="Enter item ID to verify"
                  value={verifyItemId}
                  onChange={(e) => setVerifyItemId(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Ownership
                </Button>
              </form>
            </Card>

            {ownershipDetails && (
              <Card>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Ownership Details
                </h3>
                <div className="space-y-3">
                  <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Item Name
                    </label>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {ownershipDetails.name}
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Item ID
                    </label>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {ownershipDetails.item_id}
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Owner Username
                    </label>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {ownershipDetails.username}
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Owner Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className={`font-mono text-sm break-all flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {ownershipDetails.owner}
                      </p>
                      <button
                        onClick={() => copyToClipboard(ownershipDetails.owner)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark 
                            ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10' 
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-600/10'
                        }`}
                        title="Copy address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 'my-items':
      default:
        return (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-2xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <Package className={`w-8 h-8 mr-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  My Items ({userItems.length})
                </h2>
                <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your owned products are automatically loaded
                </p>
              </div>
              <Button
                onClick={loadUserItems}
                loading={loading}
                disabled={!isConnected}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {!isConnected && (
              <div className="mb-6">
                <Card className={`border ${
                  isDark 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <p className={isDark ? 'text-amber-300' : 'text-amber-700'}>
                      Connect your wallet to view and manage your items
                    </p>
                    <Button onClick={connectWallet} size="sm" variant="outline">
                      Connect Wallet
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {userItems.length > 0 ? (
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {userItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-xl p-4 transition-colors ${
                      isDark 
                        ? 'border-green-500/20 hover:border-green-500/40' 
                        : 'border-green-600/20 hover:border-green-600/40'
                    }`}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {item.name}
                        </h3>
                        <div className={`space-y-1 text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <p><span className={isDark ? 'text-green-400' : 'text-green-600'}>ID:</span> {item.item_id}</p>
                          <p><span className={isDark ? 'text-green-400' : 'text-green-600'}>Serial:</span> {item.serial}</p>
                          <p><span className={isDark ? 'text-green-400' : 'text-green-600'}>Manufacturer:</span> {item.manufacturer}</p>
                        </div>
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <p><span className={isDark ? 'text-green-400' : 'text-green-600'}>Production Date:</span> {item.date}</p>
                        <p className="truncate" title={item.metadata_hash}>
                          <span className={isDark ? 'text-green-400' : 'text-green-600'}>Metadata Hash:</span> {item.metadata_hash}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {isConnected ? 'No items found.' : 'Connect your wallet to load your items.'}
                </p>
              </div>
            )}
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {renderContent()}
          {loading && <LoadingSpinner />}
        </motion.div>
      </div>
    </div>
  );
};