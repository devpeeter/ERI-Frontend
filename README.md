# ERI - Blockchain Product Verification Platform

![ERI Logo](https://via.placeholder.com/200x80/10b981/ffffff?text=ERI)

## 🌟 Overview

**ERI (Enhanced Reliability Infrastructure)** is a cutting-edge blockchain-based platform that revolutionizes product authentication and ownership verification. Built on the Starknet blockchain, ERI provides manufacturers and users with tamper-proof digital certificates, ensuring product authenticity and enabling secure ownership transfers through cryptographic verification.

## 🚀 Key Features

### 🏭 For Manufacturers
- **Blockchain Registration**: Register as a verified manufacturer on Starknet
- **Digital Certificates**: Create cryptographically signed product certificates
- **QR Code Generation**: Generate tamper-proof QR codes for each product
- **Bulk Processing**: Upload CSV files for batch certificate creation
- **Real-time Verification**: Instant signature verification on-chain

### 👥 For Users
- **Ownership Management**: View and manage all owned products
- **Secure Transfers**: Generate transfer codes for ownership changes
- **Claim Products**: Claim ownership using transfer codes or QR scans
- **Verification Tools**: Verify product authenticity and ownership
- **Dashboard**: Comprehensive user dashboard with auto-loading items

### 📱 QR Code System
- **Camera Integration**: Built-in QR scanner with camera access
- **Multi-Action Support**: Claim ownership, verify authenticity, check ownership
- **Cross-Platform**: Works on mobile and desktop devices
- **Instant Parsing**: Automatic certificate data extraction

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Toastify** for notifications

### Blockchain
- **Starknet** blockchain integration
- **StarknetKit** for wallet connections
- **Starknet.js** for smart contract interactions
- **Typed Data** for cryptographic signatures

### Additional Libraries
- **Papa Parse** for CSV processing
- **QRCode.react** for QR code generation
- **React QR Scanner** for QR code reading

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Starknet wallet (Argent X or Braavos)

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/eri-platform.git
cd eri-platform

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your environment variables
VITE_OWNERSHIP_ADDRESS=your_ownership_contract_address
VITE_AUTHENTICITY_ADDRESS=your_authenticity_contract_address
VITE_SEPOLIA_URL=https://starknet-sepolia.public.blastapi.io

# Start development server
npm run dev
```

## 🎯 Usage Guide

### Getting Started
1. **Connect Wallet**: Use Argent X or Braavos wallet
2. **Choose Role**: Select Manufacturer or User from navigation
3. **Register**: Complete registration process on blockchain
4. **Start Using**: Access features through the sidebar

### For Manufacturers
1. **Register Company**: 
   - Navigate to Manufacturer → Register
   - Enter company name and submit transaction

2. **Create Certificates**:
   - Use sidebar → Create Certificate
   - Fill product details or upload CSV
   - Generate QR codes after verification

3. **Bulk Processing**:
   - Use sidebar → Bulk Upload
   - Upload CSV with columns: name, unique_id, serial, metadata
   - Process all certificates at once

### For Users
1. **Register Account**:
   - Navigate to User → Register
   - Enter username and submit transaction

2. **Manage Products**:
   - View "My Items" automatically loaded
   - Generate transfer codes for gifting
   - Claim products using codes

3. **Verification**:
   - Verify ownership without wallet connection
   - Check product authenticity
   - Scan QR codes for instant verification

### QR Code Scanning
1. **Access Scanner**: Click "QR Scanner" in navigation
2. **Scan Code**: Use camera or upload image
3. **Choose Action**: 
   - Claim Ownership
   - Verify Authenticity  
   - Check Ownership
4. **View Results**: See parsed certificate data and verification status

## 🎨 Design Philosophy

### Visual Design
- **Dark/Light Mode**: Automatic theme switching with user preference
- **Green/Black Theme**: Professional Web3 aesthetic with green accents
- **Glassmorphism**: Modern translucent cards with backdrop blur
- **Smooth Animations**: Framer Motion powered micro-interactions

### User Experience
- **Responsive Design**: Mobile-first approach with breakpoints
- **Intuitive Navigation**: Clear sidebar organization by functionality
- **Real-time Feedback**: Toast notifications for all actions
- **Loading States**: Visual feedback during blockchain transactions

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Semantic HTML and ARIA labels
- **Color Contrast**: WCAG compliant color ratios
- **Mobile Friendly**: Touch-optimized interface

## 🔧 Smart Contract Integration

### Contract Types
- **Authenticity Contract**: Handles manufacturer registration and certificate verification
- **Ownership Contract**: Manages product ownership and transfers

### Key Functions
```typescript
// Manufacturer functions
manufacturer_registers(name: string)
verify_signature(certificate: Certificate, msgHash: string)

// User functions  
user_registers(username: string)
user_claim_ownership(certificate: Certificate, msgHash: string)
generate_change_of_ownership_code(itemId: string, newOwner: string)
new_owner_claim_ownership(itemHash: string)
verify_ownership(itemId: string)
```

## 🔐 Security Features

### Cryptographic Security
- **EIP-712 Typed Data**: Structured data signing
- **On-chain Verification**: Smart contract signature validation
- **Immutable Records**: Blockchain-stored certificates
- **Hash Verification**: Content integrity checks

### User Security
- **Wallet Integration**: Secure wallet connections
- **Transaction Signing**: User-controlled transaction approval
- **Error Handling**: Comprehensive error management
- **Input Validation**: Client and contract-side validation

## 🚀 Deployment

### Build for Production
```bash
# Build the application
npm run build

# Preview build locally
npm run preview
```

### Environment Variables
```env
VITE_OWNERSHIP_ADDRESS=0x...
VITE_AUTHENTICITY_ADDRESS=0x...
VITE_SEPOLIA_URL=https://starknet-sepolia.public.blastapi.io
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React rules
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Starknet Team** for the robust blockchain infrastructure
- **StarkWare** for the scaling technology
- **React Team** for the excellent frontend framework
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

### Documentation
- [Starknet Documentation](https://docs.starknet.io/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community
- [GitHub Issues](https://github.com/your-username/eri-platform/issues)
- [Discord Community](https://discord.gg/your-discord)
- [Twitter Updates](https://twitter.com/your-twitter)

---

**Built with ❤️ for the Web3 community**

*ERI - Enhancing trust through blockchain verification*