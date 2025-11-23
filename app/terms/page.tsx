import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { ScrollToTop } from "@/components/scroll-to-top"

export const metadata = {
  title: "Terms of Service | Wingman Pro",
  description: "Wingman Pro Terms of Service",
}

export default function TermsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 text-slate-900 dark:text-white">
      <SiteNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">TERMS AND CONDITIONS OF SERVICE</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          RALLYUP SOLUTIONS PRIVATE LIMITED (for Wingman Pro)
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-10">
          Effective Date: October 31, 2025
        </p>

        <section className="space-y-6 text-slate-700 dark:text-slate-300">
          <p>
            These Terms and Conditions of Service ("Terms") constitute a legally binding agreement between RallyUp Solutions Private Limited ("RallyUp Solutions," "we," "us," or "our"), and you, the client, administrator, club, supporters' club, or end-user ("User," "you," or "your") concerning your access to and use of our proprietary web application platform, Wingman Pro (the "Service" or "Wingman Pro"), and all associated services.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing, registering for, or using Wingman Pro, you agree that you have read, understood, and agree to be bound by all of these Terms and Conditions. If you do not agree with all of these Terms, you are expressly prohibited from using Wingman Pro and must discontinue use immediately.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. General Terms of Use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Service Purpose:</strong> Wingman Pro is a digital hub designed to streamline member management, content delivery, and event engagement for supporter groups.</li>
            <li><strong>Eligibility:</strong> Use of Wingman Pro is limited to individuals who can form legally binding contracts under applicable law. By registering, you represent and warrant that you are at least 18 years of age or the age of legal majority in your jurisdiction.</li>
            <li><strong>Availability:</strong> We will use commercially reasonable efforts to make Wingman Pro available. However, we do not guarantee that Wingman Pro, or any content on it, will always be available or uninterrupted.</li>
            <li><strong>Changes:</strong> We reserve the right, in our sole discretion, to make changes or modifications to these Terms at any time. We will provide reasonable notice of any material changes, typically by posting the revised Terms on the Service with the Effective Date and may notify you directly via email. The updated version of these Terms will be effective seven (7) days after posting. Your continued use of Wingman Pro after the effective date of the revised Terms constitutes your acceptance of the changes.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">3. User Accounts and Authentication</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Registration:</strong> To access Wingman Pro, you must register an account and adhere to all registration requirements. You must provide true, accurate, current, and complete information.</li>
            <li><strong>Authentication and OTP:</strong> Access to Wingman Pro is secured via an OTP (One-Time Password) mechanism. The OTP will be shared with the User via Email and Mobile SMS. You acknowledge that you are responsible for maintaining the confidentiality of your mobile device and email access and all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</li>
            <li><strong>Data Accuracy:</strong> You are responsible for ensuring the accuracy and completeness of any data, information, or content you provide or upload to Wingman Pro. We shall not be liable for any errors or omissions in data provided by the User.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">4. Relationship Agreement with Sports Clubs</h2>
          <p>
            If you are a sports club or supporter group ("Club") contracting with RallyUp Solutions for the use of Wingman Pro, the following terms apply:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>User Management Responsibility:</strong> The Club acknowledges and agrees that the full responsibility for member enrollment, management, data maintenance, and administration of access rights rests solely with the Club.</li>
            <li><strong>Data Accuracy and Consent Obligation:</strong> The Club is solely responsible for the accuracy, completeness, and legality of all member data uploaded or managed within Wingman Pro. The Club further represents and warrants that it has secured all necessary consents, permissions, and rights to upload and manage the member data within Wingman Pro and that the data transfer complies with all applicable privacy laws.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">5. Intellectual Property Rights (IP)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Our IP:</strong> All content, features, functionality, design, code, logos, trademarks, and the underlying technology of Wingman Pro are owned by RallyUp Solutions Private Limited and are protected by copyright and intellectual property laws.</li>
            <li><strong>License Grant:</strong> We grant you a limited, non-exclusive, non-transferable, revocable license to access and use Wingman Pro solely for its intended purpose and subject to your compliance with these Terms. For Clubs, the granted license includes the right to sublicense access to its registered members, strictly in accordance with these Terms and solely for the intended purpose of Wingman Pro.</li>
            <li><strong>User Content:</strong> You retain all ownership rights to the content, data, and materials you upload to Wingman Pro ("User Content"). By submitting User Content, you grant RallyUp Solutions a worldwide, royalty-free, perpetual license to use, reproduce, and display the User Content solely for the purpose of providing and maintaining the services to you and your supporter group.</li>
            <li><strong>Prohibition on Copying/Reproduction:</strong> You are strictly prohibited from copying, duplicating, or reproducing the application (Wingman Pro) or any significant portion of its design, underlying code, or functionality without the express written permission of RallyUp Solutions Private Limited.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">6. Prohibitions and Use Restrictions</h2>
          <p>
            You agree not to access or use Wingman Pro for any purpose that is unlawful or prohibited by these Terms. Specifically, you agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Unauthorized Service Provision:</strong> You are prohibited from reselling, sublicensing, or otherwise providing access to Wingman Pro or any of its services to any third-party who is not directly in contract with RallyUp Solutions Private Limited or using the service as a registered member of your contracted club.</li>
            <li><strong>Reverse Engineering:</strong> Circumvent, disable, or otherwise interfere with security-related features of Wingman Pro or attempt to decipher, decompile, disassemble, or reverse engineer any of the underlying software.</li>
            <li><strong>Malicious Interference:</strong> Introduce or upload any software routines, mechanisms, or code intended to disrupt, damage, gain unauthorized access to, or detrimentally interfere with any system, data, or personal information on Wingman Pro (including, but not limited to, viruses, worms, back doors, time bombs, or other destructive agents).</li>
            <li><strong>Spam and Unsolicited Communications:</strong> Engage in any use of the system to send unsolicited commercial emails or use automated scripts for communication without express authorization.</li>
            <li><strong>Unauthorized Access:</strong> Engage in unauthorized framing of or linking to Wingman Pro.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">7. Data Protection and Security</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Data Collection:</strong> We collect and process personal data, including data used for the mandatory OTP authentication. By using Wingman Pro, you consent to our collection and use of this data as outlined in our Privacy Policy (a separate document).</li>
            <li><strong>Security Measures:</strong> We commit to adhering to best practices for data security and user privacy. We will implement appropriate technical and organizational measures to protect personal data from unauthorized access, disclosure, or misuse.</li>
            <li><strong>User Responsibility:</strong> You acknowledge that you are responsible for protecting the confidentiality of your own user data and any sensitive information stored under your account.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">8. Limitations of Liability</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>No Warranties:</strong> Wingman Pro is provided on an "as-is" and "as-available" basis. We expressly disclaim all warranties, express or implied, including, without limitation, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</li>
            <li><strong>Limitation of Damages:</strong> Except in cases of our gross negligence or willful misconduct, in no event will RallyUp Solutions Private Limited, its directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of Wingman Pro, even if we have been advised of the possibility of such damages.</li>
            <li><strong>Maximum Liability:</strong> Notwithstanding anything to the contrary contained herein, our liability to you for any cause whatsoever and regardless of the form of the action, will at all times be limited to the amount paid, if any, by you to us during the six (6) month period prior to any cause of action arising.</li>
          </ul>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">9. Termination</h2>
          <p>
            We may, in our sole discretion and without liability, terminate or suspend your account and deny access to all or any part of Wingman Pro for any reason, including, without limitation, breach of any representation, warranty, or covenant contained in these Terms. Upon termination, your right to use Wingman Pro will immediately cease.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">10. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms and your use of Wingman Pro are governed by and construed in accordance with the laws of India.
          </p>
          <p>
            <strong>Dispute Resolution:</strong> Prior to the initiation of any legal action, the parties agree to first attempt to resolve any dispute, claim, or controversy arising out of or relating to these Terms through good-faith mediation in Mumbai, Maharashtra, India, with a mutually agreed-upon mediator. Any legal action or proceeding arising under these Terms shall be brought exclusively in the courts located in Mumbai, Maharashtra, India, and you hereby consent to the personal jurisdiction and venue of such courts.
          </p>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">11. Contact Information</h2>
          <p>
            If you have questions or comments about these Terms, please contact us at:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ankit Ameria – on behalf of RallyUp Solutions Private Limited</li>
            <li>Email: <a className="underline" href="mailto:response@wingmanpro.tech">response@wingmanpro.tech</a></li>
            <li>Contact: +91 89551 22434</li>
          </ul>
        </section>

        <div className="mt-10">
          <Link href="/privacy" className="text-sky-700 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200">View our Privacy Policy</Link>
        </div>
      </div>
      <SiteFooter />
      <ScrollToTop />
    </main>
  )
}


