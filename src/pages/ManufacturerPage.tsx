import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {Building2, Upload, FileText, Shield, Download, AlertCircle, Lightbulb, Eye} from 'lucide-react';
import {toast} from 'react-toastify';
import Papa from 'papaparse';
import {typedData} from 'starknet';
import {Button} from '../components/ui/Button';
import {Card} from '../components/ui/Card';
import {Input} from '../components/ui/Input';
import {LoadingSpinner} from '../components/ui/LoadingSpinner';
import {QRCodeDisplay} from '../components/QRCodeDisplay';
import {useWallet} from '../contexts/WalletContext';
import {useTheme} from '../contexts/ThemeContext';
import {Certificate, CertificateResult, ContractType} from '../types';
import {getContract, AUTHENTICITY_ADDRESS, stringToFelt252, felt252ToString} from '../utils/blockchain';
import {getTypedData} from '../utils/certificateData';
import {parseError, handleError} from '../utils/errorParser';

interface ManufacturerPageProps {
    activeFeature: string;
}

export const ManufacturerPage: React.FC<ManufacturerPageProps> = ({activeFeature}) => {
    const {isDark} = useTheme();
    const {provider, account, address, isConnected, connectWallet} = useWallet();
    const [loading, setLoading] = useState(false);

    // Registration state
    const [manufacturerName, setManufacturerName] = useState('');

    // Single certificate state
    const [certificate, setCertificate] = useState({
        name: '',
        unique_id: '',
        serial: '',
        date: '',
        owner: '',
        metadata: ''
    });
    const [singleQRData, setSingleQRData] = useState('');

    // Product authenticity verification state
    const [verifySignature, setVerifySignature] = useState('');
    const [authResult, setAuthResult] = useState('');

    // Bulk certificates state
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [certificateResults, setCertificateResults] = useState<CertificateResult[]>([]);

    const requireWalletConnection = () => {
        if (!isConnected) {
            toast.error('Please connect your wallet to continue');
            connectWallet();
            return false;
        }
        return true;
    };

    const registerManufacturer = async () => {
        if (!requireWalletConnection()) return;

        if (!manufacturerName.trim()) {
            toast.error('Please enter manufacturer name');
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);

            const res = await contract.manufacturer_registers(stringToFelt252(manufacturerName));
            const txHash = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);
            const events = contract.parseEvents(txResult);

            const manuAddress = events[0]["eri::events::EriEvents::ManufacturerRegistered"].manufacturer_address;
            const manuName = events[0]["eri::events::EriEvents::ManufacturerRegistered"].manufacturer_name;

            toast.success(`Manufacturer ${felt252ToString(manuName.toString())} registered successfully!`);
            setManufacturerName('');
        } catch (error: unknown) {
            handleError(error, 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const verifyProductAuthenticity = async () => {
        if (!requireWalletConnection()) return;

        if (!certificate.name || !certificate.unique_id || !certificate.serial || !certificate.date || !certificate.owner || !certificate.metadata || !verifySignature) {
            toast.error('Please fill in all required fields including the signature');
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW, provider!, account, address);

            const cert: Certificate = {
                name: certificate.name,
                id: certificate.unique_id,
                serial: certificate.serial,
                date: certificate.date,
                owner: certificate.owner,
                metadata: certificate.metadata
                    .split(',')
                    .map((item: string) => item.trim())
                    .filter(Boolean),
            };

            const result = await contract.verify_authenticity(cert, verifySignature);

            if (!result) {
                throw new Error('Product authenticity verification failed!');
            }

            setAuthResult(result ? 'Authentic' : 'Not Authentic');
            toast.success(`${cert.name} authenticity is: ${result ? 'Authentic' : 'Not Authentic'}`);

            // Reset form
            setCertificate({
                name: '',
                unique_id: '',
                serial: '',
                date: '',
                owner: '',
                metadata: ''
            });
            setVerifySignature('');
        } catch (error: unknown) {
            handleError(error, 'Verification failed');
            setAuthResult('Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    const signAndVerifySingleCertificate = async () => {
        if (!requireWalletConnection()) return;

        if (!certificate.name || !certificate.unique_id || !certificate.serial) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW, provider!, account, address);

            const cert: Certificate = {
                name: certificate.name,
                id: certificate.unique_id,
                serial: certificate.serial,
                date: Math.floor(Date.now() / 1000).toString(),
                owner: address!,
                metadata: certificate.metadata
                    .split(',')
                    .map((item: string) => item.trim())
                    .filter(Boolean),
            };

            const certTypedData = getTypedData(cert);
            const msgHash = typedData.getMessageHash(certTypedData, address!);

            const result = await contract.manufacturer_verify_signature(cert, msgHash, address);

            if (!result) {
                throw new Error('Signature verification failed!');
            }

            const qrData = JSON.stringify({
                cert,
                msgHash,
            });

            setSingleQRData(qrData);
            toast.success('Certificate signed and verified successfully! QR code generated.');

            // Reset form
            setCertificate({
                name: '',
                unique_id: '',
                serial: '',
                date: '',
                owner: '',
                metadata: ''
            });
        } catch (error: unknown) {
            handleError(error, 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            toast.error('No file selected');
            return;
        }

        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        if (!requireWalletConnection()) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const parsedCertificates: Certificate[] = result.data
                    .map((row: unknown, index: number) => {
                        if (typeof row !== 'object' || row === null) {
                            toast.warn(`Skipped row ${index + 1}: Invalid row format`);
                            return null;
                        }

                        const {name, unique_id, serial, metadata} = row as {
                            name?: unknown;
                            unique_id?: unknown;
                            serial?: unknown;
                            metadata?: unknown;
                        };

                        if (
                            typeof name !== 'string' || !name.trim() ||
                            typeof unique_id !== 'string' || !unique_id.trim() ||
                            typeof serial !== 'string' || !serial.trim() ||
                            typeof metadata !== 'string' || !metadata.trim()
                        ) {
                            toast.warn(`Skipped row ${index + 1}: Missing or invalid data`);
                            return null;
                        }

                        return {
                            name: name.trim(),
                            id: unique_id.trim(),
                            serial: serial.trim(),
                            date: Math.floor(Date.now() / 1000).toString(),
                            owner: address!,
                            metadata: metadata
                                .split(',')
                                .map((item: string) => item.trim())
                                .filter(Boolean),
                        };
                    })
                    .filter((cert): cert is Certificate => cert !== null);

                setCertificates(parsedCertificates);
                const skippedCount = result.data.length - parsedCertificates.length;
                toast.success(
                    `Loaded ${parsedCertificates.length} valid certificates${
                        skippedCount > 0 ? ` (${skippedCount} rows skipped)` : ''
                    }`
                );
            },
            error: (error) => {
                handleError(error, 'CSV parsing error');
            },
        });
    };

    const processMultipleCertificates = async () => {
        if (!requireWalletConnection()) return;

        if (certificates.length === 0) {
            toast.error('No certificates to process');
            return;
        }

        setLoading(true);
        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW, provider!, account, address);
            const results: CertificateResult[] = [];

            for (const certInput of certificates) {
                try {
                    const certTypedData = getTypedData(certInput);
                    const msgHash = typedData.getMessageHash(certTypedData, address!);

                    const result = await contract.manufacturer_verify_signature(certInput, msgHash, address);

                    if (!result) {
                        throw new Error('Signature verification failed!');
                    }

                    const qrData = JSON.stringify({
                        certificate: certInput,
                        msgHash,
                    });

                    results.push({
                        certificate: certInput,
                        msgHash,
                        qrData,
                        verificationResult: result,
                    });
                } catch (error: unknown) {
                    results.push({
                        certificate: certInput,
                        msgHash: '',
                        qrData: '',
                        verificationResult: false,
                        error: parseError(error),
                    });
                }
            }

            setCertificateResults(results);
            toast.success(`Processed ${results.length} certificates`);
        } catch (error: unknown) {
            handleError(error, 'Processing failed');
        } finally {
            setLoading(false);
        }
    };

    const downloadAllQRCodes = () => {
        certificateResults.forEach((result, index) => {
            if (result.qrData) {
                setTimeout(() => {
                    const canvas = document.querySelectorAll('canvas')[index];
                    if (canvas) {
                        const link = document.createElement('a');
                        link.href = canvas.toDataURL('image/png');
                        link.download = `certificate-qr-${result.certificate.id}.png`;
                        link.click();
                    }
                }, index * 100);
            }
        });
    };

    const renderContent = () => {
        switch (activeFeature) {
            case 'register-manufacturer':
                return (
                    <Card className="max-w-2xl mx-auto">
                        <div className="text-center mb-6">
                            <Building2
                                className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`}/>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                Register as Manufacturer
                            </h2>
                            <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Register your company on the blockchain to start creating verified certificates
                            </p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                registerManufacturer();
                            }}
                            className="space-y-6"
                        >
                            <Input
                                placeholder="Enter manufacturer name"
                                value={manufacturerName}
                                onChange={(e) => setManufacturerName(e.target.value)}
                                required
                            />
                            <Button
                                type="submit"
                                loading={loading}
                                disabled={!isConnected}
                                className="w-full"
                            >
                                {!isConnected ? 'Connect Wallet to Register' : 'Register Manufacturer'}
                            </Button>
                        </form>
                    </Card>
                );

            case 'create-certificate':
                return (
                    <div className="grid lg:grid-cols-2 gap-8">
                        <Card>
                            <div className="mb-6">
                                <FileText className={`w-8 h-8 mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`}/>
                                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                    Create Certificate
                                </h2>
                                <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Create and verify a single product certificate (Manufacturer only)
                                </p>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    signAndVerifySingleCertificate();
                                }}
                                className="space-y-4"
                            >
                                <Input
                                    placeholder="Product Name"
                                    value={certificate.name}
                                    onChange={(e) => setCertificate({...certificate, name: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Unique Product ID"
                                    value={certificate.unique_id}
                                    onChange={(e) => setCertificate({...certificate, unique_id: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Serial Number"
                                    value={certificate.serial}
                                    onChange={(e) => setCertificate({...certificate, serial: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Metadata (comma separated)"
                                    value={certificate.metadata}
                                    onChange={(e) => setCertificate({...certificate, metadata: e.target.value})}
                                />
                                <Button
                                    type="submit"
                                    loading={loading}
                                    disabled={!isConnected}
                                    className="w-full"
                                >
                                    <Shield className="w-4 h-4 mr-2"/>
                                    {!isConnected ? 'Connect Wallet to Create' : 'Sign & Verify Certificate'}
                                </Button>
                            </form>
                        </Card>

                        {singleQRData && (
                            <QRCodeDisplay
                                data={singleQRData}
                                label="Certificate QR Code"
                                itemId={certificate.unique_id}
                            />
                        )}
                    </div>
                );

            case 'verify-authenticity':
                return (
                    <div className="grid lg:grid-cols-2 gap-8">
                        <Card>
                            <div className="mb-6">
                                <Eye className={`w-8 h-8 mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`}/>
                                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                    Verify Product Authenticity
                                </h2>
                                <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Verify the authenticity of a product using certificate data and signature
                                </p>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    verifyProductAuthenticity();
                                }}
                                className="space-y-4"
                            >
                                <Input
                                    placeholder="Product Name"
                                    value={certificate.name}
                                    onChange={(e) => setCertificate({...certificate, name: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Unique Product ID"
                                    value={certificate.unique_id}
                                    onChange={(e) => setCertificate({...certificate, unique_id: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Serial Number"
                                    value={certificate.serial}
                                    onChange={(e) => setCertificate({...certificate, serial: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Production Date (timestamp)"
                                    value={certificate.date}
                                    onChange={(e) => setCertificate({...certificate, date: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Owner Address"
                                    value={certificate.owner}
                                    onChange={(e) => setCertificate({...certificate, owner: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Metadata (comma separated)"
                                    value={certificate.metadata}
                                    onChange={(e) => setCertificate({...certificate, metadata: e.target.value})}
                                    required
                                />
                                <Input
                                    placeholder="Signature Hash"
                                    value={verifySignature}
                                    onChange={(e) => setVerifySignature(e.target.value)}
                                    required
                                />
                                <Button
                                    type="submit"
                                    loading={loading}
                                    disabled={!isConnected}
                                    className="w-full"
                                >
                                    <Eye className="w-4 h-4 mr-2"/>
                                    {!isConnected ? 'Connect Wallet to Verify' : 'Verify Authenticity'}
                                </Button>
                            </form>
                        </Card>

                        {authResult && (
                            <Card>
                                <div className="text-center">
                                    <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        Authenticity Result
                                    </h3>
                                    <div className={`p-6 rounded-xl border-2 ${
                                        authResult === 'Authentic'
                                            ? isDark
                                                ? 'border-green-500 bg-green-500/10 text-green-400'
                                                : 'border-green-600 bg-green-50 text-green-700'
                                            : isDark
                                                ? 'border-red-500 bg-red-500/10 text-red-400'
                                                : 'border-red-600 bg-red-50 text-red-700'
                                    }`}>
                                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                                            authResult === 'Authentic'
                                                ? 'bg-green-500'
                                                : 'bg-red-500'
                                        }`}>
                                            {authResult === 'Authentic' ? (
                                                <Shield className="w-8 h-8 text-white" />
                                            ) : (
                                                <AlertCircle className="w-8 h-8 text-white" />
                                            )}
                                        </div>
                                        <p className="text-2xl font-bold">{authResult}</p>
                                        <p className="text-sm mt-2 opacity-80">
                                            {authResult === 'Authentic' 
                                                ? 'This product has been verified as authentic'
                                                : 'This product could not be verified as authentic'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                );

            case 'bulk-upload':
                return (
                    <>
                        <Card className="mb-8">
                            <div className="mb-6">
                                <Upload className={`w-8 h-8 mb-4 ${isDark ? 'text-green-400' : 'text-green-600'}`}/>
                                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                    Bulk Certificate Upload
                                </h2>
                                <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Upload a CSV file with multiple certificates to process in batch
                                </p>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    processMultipleCertificates();
                                }}
                                className="space-y-6"
                            >
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Upload CSV File
                                    </label>
                                    <Input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="cursor-pointer"
                                    />
                                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        CSV should contain columns: name, unique_id, serial, metadata
                                    </p>
                                </div>

                                {certificates.length > 0 && (
                                    <div className={`p-4 rounded-xl border ${
                                        isDark
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-green-50 border-green-200'
                                    }`}>
                                        <p className={`font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                                            {certificates.length} certificates loaded and ready for processing
                                        </p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    loading={loading}
                                    disabled={!isConnected || certificates.length === 0}
                                    className="w-full"
                                >
                                    <Shield className="w-4 h-4 mr-2"/>
                                    {!isConnected ? 'Connect Wallet to Process' : `Process ${certificates.length} Certificates`}
                                </Button>
                            </form>
                        </Card>

                        {/* Results */}
                        {certificateResults.length > 0 && (
                            <Card>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        Processing Results
                                    </h3>
                                    <Button
                                        onClick={downloadAllQRCodes}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Download className="w-4 h-4 mr-2"/>
                                        Download All QR Codes
                                    </Button>
                                </div>

                                <div className="space-y-6 max-h-96 overflow-y-auto">
                                    {certificateResults.map((result, index) => (
                                        <div
                                            key={result.certificate.id || index}
                                            className={`border rounded-xl p-4 ${
                                                isDark
                                                    ? 'border-green-500/20'
                                                    : 'border-green-600/20'
                                            }`}
                                        >
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                        {result.certificate.name}
                                                    </h4>
                                                    <div
                                                        className={`space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        <p>ID: {result.certificate.id}</p>
                                                        <p>Serial: {result.certificate.serial}</p>
                                                        <p className={`font-medium ${
                                                            result.verificationResult
                                                                ? isDark ? 'text-green-400' : 'text-green-600'
                                                                : isDark ? 'text-red-400' : 'text-red-600'
                                                        }`}>
                                                            Status: {result.verificationResult ? 'Verified' : 'Failed'}
                                                            {result.error && ` - ${result.error}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {result.qrData && (
                                                    <div className="flex justify-center">
                                                        <QRCodeDisplay
                                                            data={result.qrData}
                                                            label={`QR Code ${index + 1}`}
                                                            itemId={result.certificate.id}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </>
                );

            default:
                return (
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <Building2
                                className={`w-16 h-16 mx-auto mb-6 ${isDark ? 'text-green-400' : 'text-green-600'}`}/>
                            <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                Manufacturer Dashboard
                            </h2>
                            <p className={`text-xl mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Create and manage product certificates with blockchain verification
                            </p>
                        </div>

                        {/* How It Works */}
                        <Card>
                            <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                How It Works for Manufacturers
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                isDark
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                    : 'bg-gradient-to-br from-green-600 to-emerald-700'
                                            }`}>
                                            1
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                Register Your Company
                                            </h4>
                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Register as a verified manufacturer on the Starknet blockchain
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                isDark
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                    : 'bg-gradient-to-br from-green-600 to-emerald-700'
                                            }`}>
                                            2
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                Create Certificates
                                            </h4>
                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Generate cryptographically signed certificates for your products
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                isDark
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                    : 'bg-gradient-to-br from-green-600 to-emerald-700'
                                            }`}>
                                            3
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                Generate QR Codes
                                            </h4>
                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Create tamper-proof QR codes for each verified certificate
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                isDark
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                    : 'bg-gradient-to-br from-green-600 to-emerald-700'
                                            }`}>
                                            4
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                Attach to Products
                                            </h4>
                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Apply QR codes to products for instant authenticity verification
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Navigation Instructions */}
                        <Card className={`border ${
                            isDark
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-blue-50 border-blue-200'
                        }`}>
                            <div className="flex items-start space-x-3">
                                <Lightbulb className={`w-6 h-6 mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}/>
                                <div>
                                    <h4 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                        Getting Started
                                    </h4>
                                    <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>
                                        Use the sidebar to access manufacturer features. Start by registering your
                                        company, then create individual certificates or upload multiple certificates via
                                        CSV for bulk processing. You can also verify product authenticity using existing certificate data.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Wallet Connection Warning */}
                        {!isConnected && (
                            <Card className={`border ${
                                isDark
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-amber-50 border-amber-200'
                            }`}>
                                <div className="flex items-center space-x-3">
                                    <AlertCircle className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}/>
                                    <p className={isDark ? 'text-amber-300' : 'text-amber-700'}>
                                        Connect your wallet to access manufacturer features
                                    </p>
                                    <Button onClick={connectWallet} size="sm" variant="outline">
                                        Connect Wallet
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className="max-w-6xl mx-auto"
                >
                    {renderContent()}
                    {loading && <LoadingSpinner/>}
                </motion.div>
            </div>
        </div>
    );
};