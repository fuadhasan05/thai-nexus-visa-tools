import React from 'react';
import GlassCard from '@/components/GlassCard';
import { FileText, Shield, AlertCircle, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

export default function TermsOfService() {
  return (
    <>
      <SEOHead page="TermsOfService" />    <div className="max-w-4xl mx-auto space-y-8">
      <GlassCard className="p-12 text-center bg-gradient-to-br from-blue-50 to-cyan-50" hover={false}>
        <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600">Last Updated: November 2025</p>
      </GlassCard>

      <GlassCard className="p-8">
        <div className="prose max-w-none">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Company Information</h2>
            <p className="text-gray-700 mb-2"><strong>Legal Name:</strong> Thai Nexus Point Co., Ltd.</p>
            <p className="text-gray-700 mb-2"><strong>Registered:</strong> Thailand</p>
            <p className="text-gray-700 mb-2"><strong>Address:</strong> 39/743 Soi Mooban Hua Na, Nong Kae, Hua Hin, Prachuap Khiri Khan 77110, Thailand</p>
            <p className="text-gray-700 mb-2"><strong>Website:</strong> https://thainexus.co.th</p>
            <p className="text-gray-700"><strong>Contact:</strong> contact@thainexus.co.th</p>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <p>By accessing and using Thai Nexus (https://thainexus.co.th), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">2. Services Provided</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <p>Thai Nexus provides:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Free Tools:</strong> Visa navigator, eligibility calculator, document checklist, 90-day tracker, immigration office locator, and other utilities</li>
                  <li><strong>Premium Features:</strong> Visa application builder (PRO tool) requiring payment</li>
                  <li><strong>Information Services:</strong> Visa guidance and immigration information</li>
                  <li><strong>AI Assistant:</strong> Automated support and guidance</li>
                  <li><strong>Knowledge Hub:</strong> Community-contributed visa information</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. Important Disclaimers</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
                  <p className="font-bold text-red-900 mb-2">CRITICAL DISCLAIMER</p>
                  <ul className="list-disc pl-6 space-y-2 text-red-800">
                    <li><strong>Not Legal Advice:</strong> We are NOT lawyers. Our tools and information do not constitute legal advice.</li>
                    <li><strong>Not Immigration Agents:</strong> Thai Nexus does not submit visa applications on your behalf.</li>
                    <li><strong>Information Only:</strong> All content is for informational purposes only.</li>
                    <li><strong>No Guarantees:</strong> We cannot guarantee visa approval or immigration outcomes.</li>
                    <li><strong>Verify Officially:</strong> Always verify information with Thai Immigration Bureau or official sources.</li>
                    <li><strong>Rules Change:</strong> Immigration laws and requirements change frequently - confirm current rules.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">4. User Accounts</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <p><strong>Account Creation:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must provide accurate information when creating an account</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>You must be at least 18 years old to create an account</li>
                  <li>One person = one account (no multiple accounts)</li>
                </ul>
                
                <p className="mt-4"><strong>Account Termination:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We may suspend or terminate accounts for violation of terms</li>
                  <li>You may delete your account at any time from your profile settings</li>
                  <li>Data will be permanently deleted within 30 days of account deletion</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">5. Payments & Credits</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">5.1 Credit System</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>New users receive 5 free credits upon registration</li>
                    <li>Credits are used for AI-powered features and premium tools</li>
                    <li>Credits are non-transferable and non-refundable</li>
                    <li>Credits do not expire while account is active</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">5.2 Premium Features (PRO Tools)</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Visa Application Builder requires one-time payment per visa type</li>
                    <li>Payment processed securely through Stripe</li>
                    <li>Access is perpetual for purchased visa types</li>
                    <li>No recurring subscription unless explicitly stated</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2">5.3 Refund Policy</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Credits: No refunds once purchased</li>
                    <li>PRO Tools: 7-day refund window if tool not used</li>
                    <li>Services: Contact support for service-related refunds</li>
                    <li>Refunds processed within 14 business days</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">6. Prohibited Uses</h2>
              </div>
              <div className="pl-13 space-y-2 text-gray-700">
                <p>You may NOT use Thai Nexus to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violate any laws or regulations</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Submit spam, malicious code, or viruses</li>
                  <li>Scrape, copy, or reproduce content without permission</li>
                  <li>Resell or redistribute our tools or services</li>
                  <li>Abuse or overload our systems</li>
                  <li>Share your account credentials with others</li>
                  <li>Post illegal, offensive, or inappropriate content</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">7. Intellectual Property</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <p>All content, designs, logos, tools, and features on Thai Nexus are the intellectual property of Thai Nexus Point Co., Ltd.</p>
                <p><strong>You may NOT:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Copy, modify, or distribute our content without written permission</li>
                  <li>Reverse engineer or decompile any part of our tools</li>
                  <li>Remove copyright or trademark notices</li>
                  <li>Create derivative works based on our platform</li>
                </ul>
                <p className="mt-3"><strong>You may:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use our tools for personal, non-commercial purposes</li>
                  <li>Share links to our website</li>
                  <li>Print content for personal reference</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">8. User Content & Knowledge Hub</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <p>If you contribute to our Knowledge Hub:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You retain ownership of your content</li>
                  <li>You grant us a license to display and distribute your content</li>
                  <li>You confirm that your content is original and does not violate others' rights</li>
                  <li>We may moderate, edit, or remove content at our discretion</li>
                  <li>You are responsible for the accuracy of information you share</li>
                </ul>
                <p className="mt-3 font-bold text-gray-900">Content Guidelines:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Must be visa/immigration related</li>
                  <li>Must be factual and helpful</li>
                  <li>No promotional content or spam</li>
                  <li>No external links without prior approval</li>
                  <li>No plagiarism or copyright infringement</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">9. Limitation of Liability</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
                  <p className="font-bold text-yellow-900 mb-2">IMPORTANT:</p>
                  <ul className="list-disc pl-6 space-y-2 text-yellow-900">
                    <li>Thai Nexus is provided "AS IS" without warranties of any kind</li>
                    <li>We are NOT liable for visa rejections, immigration issues, or legal problems</li>
                    <li>We are NOT responsible for decisions made based on our information</li>
                    <li>We do NOT guarantee accuracy, completeness, or timeliness of information</li>
                    <li>Maximum liability is limited to the amount you paid us (if any)</li>
                    <li>We are NOT liable for indirect, consequential, or punitive damages</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">10. Third-Party Services</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <p>Thai Nexus integrates with third-party services:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Stripe:</strong> Payment processing (subject to Stripe's terms)</li>
                  <li><strong>OpenAI:</strong> AI assistant features (subject to OpenAI's terms)</li>
                  <li><strong>Google Maps:</strong> Location services (subject to Google's terms)</li>
                </ul>
                <p className="mt-3">We are not responsible for third-party services or their terms. Use at your own risk.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">11. Indemnification</h2>
              </div>
              <div className="pl-13 text-gray-700">
                <p>You agree to indemnify and hold harmless Thai Nexus Point Co., Ltd., its officers, employees, and partners from any claims, damages, losses, or expenses arising from:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Your use of our services</li>
                  <li>Your violation of these terms</li>
                  <li>Your violation of any laws or third-party rights</li>
                  <li>Content you submit or share</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">12. Governing Law & Disputes</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>These terms are governed by the laws of Thailand</li>
                  <li>Any disputes will be resolved in Thai courts</li>
                  <li>We encourage resolving issues through contact@thainexus.co.th first</li>
                  <li>If legal action is necessary, jurisdiction is Prachuap Khiri Khan, Thailand</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">13. Termination</h2>
              </div>
              <div className="pl-13 text-gray-700">
                <p>We reserve the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Terminate or suspend your account immediately for violations</li>
                  <li>Refuse service to anyone at any time</li>
                  <li>Discontinue services with 30 days notice</li>
                  <li>Modify features or pricing with notice</li>
                </ul>
                <p className="mt-3">Upon termination:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your access to paid features ends</li>
                  <li>No refunds for partial periods</li>
                  <li>Data may be deleted per our privacy policy</li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">14. Miscellaneous</h2>
              </div>
              <div className="pl-13 space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Entire Agreement:</strong> These terms constitute the entire agreement between you and Thai Nexus</li>
                  <li><strong>Severability:</strong> If any provision is invalid, the rest remains in effect</li>
                  <li><strong>No Waiver:</strong> Our failure to enforce any right doesn't waive that right</li>
                  <li><strong>Assignment:</strong> You cannot transfer these terms; we may assign them to successors</li>
                  <li><strong>Force Majeure:</strong> We're not liable for delays due to circumstances beyond our control</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Contact & Questions</h2>
              <p className="text-gray-700 mb-3">Questions about these terms? Contact us:</p>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Email:</strong> <a href="mailto:contact@thainexus.co.th" className="text-blue-600 hover:underline">contact@thainexus.co.th</a></li>
                <li><strong>WhatsApp:</strong> <a href="https://wa.me/66923277723" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">+66 92 327 7723</a></li>
                <li><strong>Company:</strong> Thai Nexus Point Co., Ltd.</li>
                <li><strong>Address:</strong> 39/743 Soi Mooban Hua Na, Nong Kae, Hua Hin, Prachuap Khiri Khan 77110, Thailand</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                By using Thai Nexus, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>    </>

  );
}