import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Scan, Users, Building2, CheckCircle, ArrowRight, Sparkles, Lock, Zap, QrCode } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface LandingPageProps {
  onPageChange: (page: 'manufacturer' | 'user' | 'qr-scan') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onPageChange }) => {
  const features = [
    {
      icon: Lock,
      title: 'Cryptographic Proof',
      description: 'Immutable certificates secured by Starknet blockchain cryptography, ensuring tamper-proof verification.'
    },
    {
      icon: Scan,
      title: 'Instant Verification',
      description: 'Simple QR code scanning reveals authentic product information and ownership details instantly.'
    },
    {
      icon: Zap,
      title: 'Seamless Transfer',
      description: 'Secure transfer of product ownership through blockchain-verified codes and smart contracts.'
    }
  ];

  const steps = [
    { step: 1, title: 'Manufacturer Registration', description: 'Register as a verified manufacturer on the Starknet blockchain' },
    { step: 2, title: 'Product Certification', description: 'Create and cryptographically sign digital certificates for your products' },
    { step: 3, title: 'QR Code Generation', description: 'Generate unique, tamper-proof QR codes for each certified product' },
    { step: 4, title: 'Customer Verification', description: 'Customers scan QR codes to verify authenticity and ownership instantly' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/20 text-green-300 mb-6 backdrop-blur-sm border border-green-500/30"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Starknet
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-600 bg-clip-text text-transparent">
                Verify. Protect. Own.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed">
              ERI leverages cutting-edge blockchain technology to create tamper-proof product certificates, 
              ensuring authenticity and enabling secure ownership transfers through cryptographic verification.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => onPageChange('manufacturer')}
                size="lg"
                className="group"
              >
                For Manufacturers
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => onPageChange('user')}
                variant="outline"
                size="lg"
                className="group"
              >
                For Users
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => onPageChange('qr-scan')}
                variant="secondary"
                size="lg"
                className="group"
              >
                <QrCode className="w-5 h-5 mr-2" />
                QR Scanner
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Why Choose ERI?
            </h2>
            <p className="text-xl text-gray-300">
              Advanced blockchain technology meets user-friendly verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="text-center h-full group">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 to-emerald-900/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              How It Works
            </h2>
            <p className="text-xl text-gray-300">
              Simple steps to secure your products with blockchain verification
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team/People Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-300">
              Join thousands of manufacturers and users securing their products with ERI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                name: "Sarah Chen",
                role: "Manufacturing Director",
                company: "TechCorp Industries",
                image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
                quote: "ERI has revolutionized how we verify our products. The blockchain integration is seamless."
              },
              {
                name: "Marcus Rodriguez",
                role: "Supply Chain Manager",
                company: "Global Electronics",
                image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
                quote: "Customer trust has increased significantly since implementing ERI's verification system."
              },
              {
                name: "Emily Watson",
                role: "Quality Assurance Lead",
                company: "Premium Goods Co.",
                image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400",
                quote: "The QR code system makes product authentication incredibly simple for our customers."
              }
            ].map((person, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="text-center">
                  <img
                    src={person.image}
                    alt={person.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-lg font-semibold mb-1 text-white">
                    {person.name}
                  </h3>
                  <p className="text-green-400 text-sm mb-2">
                    {person.role}
                  </p>
                  <p className="text-gray-400 text-xs mb-4">
                    {person.company}
                  </p>
                  <p className="text-gray-300 text-sm italic">
                    "{person.quote}"
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">
                Ready to Secure Your Products?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join the blockchain revolution in product authentication and ownership verification.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => onPageChange('manufacturer')}
                  size="lg"
                >
                  Start as Manufacturer
                </Button>
                <Button
                  onClick={() => onPageChange('user')}
                  variant="outline"
                  size="lg"
                >
                  Verify as User
                </Button>
              </div>
            </motion.div>
          </Card>
        </div>
      </section>
    </div>
  );
};