import React from 'react';
import GlassCard from '../../components/GlassCard';
import { Shield, Lock, Eye, UserCheck, Database, Globe } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <GlassCard className="p-12 text-center bg-gradient-to-br from-blue-50 to-cyan-50" hover={false}>
        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600">Last Updated: November 2025</p>
      </GlassCard>

      <GlassCard className="p-8">
        <div className="prose max-w-none">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Company Information</h2>
            <p className="text-gray-700 mb-2"><strong>Legal Name:</strong> Thai Nexus Point Co., Ltd.</p>
            <p className="text-gray-700 mb-2"><strong>Registered:</strong> Thailand</p>
            <p className="text-gray-700 mb-2"><strong>Address (Thai):</strong> 39/743 ซอยหมู่บ้านหัวนา ตำบลหนองแก อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์ 77110</p>
            <p className="text-gray-700 mb-2"><strong>Address (English):</strong> 39/743 Soi Mooban Hua Na, Nong Kae, Hua Hin, Prachuap Khiri Khan 77110, Thailand</p>
            <p className="text-gray-700 mb-2"><strong>Website:</strong> https://thainexus.co.th</p>
            <p className="text-gray-700"><strong>Contact:</strong> contact@thainexus.co.th</p>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">1.1 Account Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Email address</li>
                    <li>Full name (optional)</li>
                    <li>Account credentials (encrypted)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">1.2 Visa Application Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Personal details you enter in tools (age, nationality, etc.)</li>
                    <li>Documents you upload (stored encrypted)</li>
                    <li>Visa journey progress and roadmaps</li>
                    <li>90-day report tracking information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">1.3 Payment Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>We DO NOT store credit card information</li>
                    <li>All payments processed through Stripe (PCI-DSS compliant)</li>
                    <li>We only store transaction IDs and purchase records</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">1.4 Usage Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Pages visited and features used</li>
                    <li>Browser type and device information</li>
                    <li>IP address and approximate location</li>
                    <li>AI assistant conversation logs (for service improvement)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
              </div>
              <div className="pl-13 space-y-2 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Provide Services:</strong> To deliver visa tools, AI assistance, and document validation</li>
                  <li><strong>Account Management:</strong> To maintain your account and preferences</li>
                  <li><strong>Communications:</strong> To send important updates, reminders, and support messages</li>
                  <li><strong>Payment Processing:</strong> To handle purchases and manage credits</li>
                  <li><strong>Service Improvement:</strong> To analyze usage and improve our tools</li>
                  <li><strong>Legal Compliance:</strong> To comply with Thai laws and regulations</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. Data Security</h2>
              </div>
              <div className="pl-13 space-y-2 text-gray-700">
                <p className="mb-3">We implement industry-standard security measures:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Encryption:</strong> All data encrypted in transit (TLS/SSL) and at rest</li>
                  <li><strong>Secure Storage:</strong> Documents stored in encrypted cloud storage</li>
                  <li><strong>Access Control:</strong> Strict authentication and authorization</li>
                  <li><strong>Regular Audits:</strong> Security reviews and vulnerability testing</li>
                  <li><strong>Backup & Recovery:</strong> Regular backups with disaster recovery procedures</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">4. Data Sharing & Third Parties</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <p>We do NOT sell your personal information. We only share data with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Stripe:</strong> For payment processing (subject to their privacy policy)</li>
                  <li><strong>OpenAI:</strong> For AI assistant features (anonymized where possible)</li>
                  <li><strong>Cloud Service Providers:</strong> For secure hosting and data storage</li>
                </ul>
                <p className="mt-3">All third parties are contractually obligated to protect your data.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">5. Your Rights</h2>
              </div>
              <div className="pl-13 space-y-2 text-gray-700">
                <p className="mb-3">Under Thai data protection laws, you have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Withdraw Consent:</strong> Opt-out of non-essential data processing</li>
                  <li><strong>Object:</strong> Object to automated decision-making</li>
                </ul>
                <p className="mt-3">To exercise these rights, contact us at <a href="mailto:contact@thainexus.co.th" className="text-blue-600 hover:underline">contact@thainexus.co.th</a></p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">6. Data Retention</h2>
              </div>
              <div className="pl-13 space-y-2 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                  <li><strong>Deleted Accounts:</strong> Data permanently deleted within 30 days of account deletion</li>
                  <li><strong>Uploaded Documents:</strong> Can be deleted immediately upon request</li>
                  <li><strong>Transaction Records:</strong> Kept for 7 years for tax and legal compliance</li>
                  <li><strong>Anonymous Analytics:</strong> May be retained indefinitely</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">7. Cookies & Tracking</h2>
              </div>
              <div className="pl-13 space-y-2 text-gray-700">
                <p>We use cookies for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential:</strong> Authentication and security</li>
                  <li><strong>Functional:</strong> Remember preferences and settings</li>
                  <li><strong>Analytics:</strong> Understand how users interact with our tools</li>
                </ul>
                <p className="mt-3">You can disable non-essential cookies in your browser settings.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">8. International Users</h2>
              </div>
              <div className="pl-13 text-gray-700">
                <p>Our services are primarily for users in Thailand. If you access from outside Thailand, your data may be transferred to and processed in Thailand, subject to Thai data protection laws.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">9. Children's Privacy</h2>
              </div>
              <div className="pl-13 text-gray-700">
                <p>Our services are not intended for users under 18 years old. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">10. Changes to This Policy</h2>
              </div>
              <div className="pl-13 text-gray-700">
                <p>We may update this privacy policy from time to time. We will notify you of significant changes via email or prominent notice on our website. Continued use of our services after changes constitutes acceptance of the updated policy.</p>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Us About Privacy</h2>
              <p className="text-gray-700 mb-3">If you have questions or concerns about this privacy policy or your data:</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> <a href="mailto:contact@thainexus.co.th" className="text-blue-600 hover:underline">contact@thainexus.co.th</a></li>
                <li><strong>WhatsApp:</strong> <a href="https://wa.me/66923277723" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">+66 92 327 7723</a></li>
                <li><strong>Company:</strong> Thai Nexus Point Co., Ltd.</li>
                <li><strong>Address:</strong> 39/743 Soi Mooban Hua Na, Nong Kae, Hua Hin, Prachuap Khiri Khan 77110, Thailand</li>
              </ul>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}