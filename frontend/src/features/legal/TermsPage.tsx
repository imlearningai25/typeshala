import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl py-12 px-4">
      <div className="mb-8">
        <Link to="/" className="text-sm text-brand-500 hover:underline">← Back to home</Link>
        <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: May 28, 2026</p>
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Typeshala ("the Service"), you agree to be bound by these Terms of
            Service. If you do not agree to these terms, please do not use the Service. We reserve the
            right to update these terms at any time; continued use of the Service after changes
            constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Description of Service</h2>
          <p>
            Typeshala is a web-based typing practice platform that offers multi-language lessons,
            real-time performance analytics, gamification features, and leaderboards. The Service is
            provided free of charge for personal, non-commercial use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. User Accounts</h2>
          <p>
            To access certain features (saving results, earning XP, leaderboard participation), you
            must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Provide accurate and complete registration information.</li>
            <li>Maintain the security of your password and account.</li>
            <li>Promptly notify us of any unauthorized use of your account.</li>
            <li>Be responsible for all activity that occurs under your account.</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms or are used
            for abusive, fraudulent, or harmful purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
            <li>Use automated scripts or bots to manipulate leaderboards, scores, or any game mechanics.</li>
            <li>Reverse-engineer, decompile, or disassemble any portion of the Service.</li>
            <li>Transmit spam, malware, or any harmful or disruptive content.</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with any person.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Intellectual Property</h2>
          <p>
            All content on the Service — including text, graphics, logos, lesson content, and
            software — is the property of Typeshala or its content suppliers and is protected by
            applicable intellectual property laws. You may not copy, reproduce, distribute, or create
            derivative works without our prior written consent.
          </p>
          <p>
            By submitting any content or feedback to the Service, you grant Typeshala a worldwide,
            royalty-free, perpetual license to use, modify, and display such content in connection
            with the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <Link to="/privacy" className="text-brand-500 hover:underline">Privacy Policy</Link>,
            which is incorporated into these Terms by reference. Please review it to understand our
            data practices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Disclaimers</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, either
            express or implied, including but not limited to implied warranties of merchantability,
            fitness for a particular purpose, or non-infringement. We do not guarantee that the
            Service will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Typeshala and its affiliates, officers, employees,
            and agents shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of, or inability to use, the Service — even if we
            have been advised of the possibility of such damages.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">9. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without
            cause, with or without notice. Upon termination, all rights granted to you under these
            Terms will immediately cease.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws. Any
            disputes arising under these Terms shall be resolved through good-faith negotiation; if
            unresolved, through binding arbitration or the courts of the applicable jurisdiction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">11. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:typeshala@aipioneerlab.com" className="text-brand-500 hover:underline">
              typeshala@aipioneerlab.com
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
}
