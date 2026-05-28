import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl py-12 px-4">
      <div className="mb-8">
        <Link to="/" className="text-sm text-brand-500 hover:underline">← Back to home</Link>
        <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last updated: May 28, 2026</p>
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-700 dark:text-gray-300">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Introduction</h2>
          <p>
            Typeshala ("we", "our", or "us") respects your privacy and is committed to protecting
            your personal information. This Privacy Policy explains what data we collect, how we use
            it, and your rights regarding that data. By using our Service, you agree to the practices
            described in this policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Information We Collect</h2>

          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">2.1 Information you provide</h3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Account data:</strong> username, email address, and hashed password when you register.</li>
            <li><strong>Profile data:</strong> optional display name or avatar URL you set in your profile.</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">2.2 Information collected automatically</h3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Typing session data:</strong> words-per-minute, accuracy, error count, duration, and anonymised keystroke timing for each practice session you submit.</li>
            <li><strong>Usage data:</strong> pages visited, lesson selections, and feature interactions — used to improve the Service.</li>
            <li><strong>Technical data:</strong> browser type, device type, and IP address collected through standard server logs and error-monitoring tools (Sentry).</li>
          </ul>

          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">2.3 Cookies and local storage</h3>
          <p>
            We use browser <strong>sessionStorage</strong> to hold your authentication token for the
            duration of your browser session — it is cleared automatically when you close the tab.
            We do not use tracking cookies or third-party advertising cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Provide and operate the Service (authentication, saving results, leaderboards).</li>
            <li>Calculate and display your XP, level, streaks, and ranking.</li>
            <li>Send essential account emails (e.g. email verification, password reset).</li>
            <li>Monitor and improve Service performance and reliability.</li>
            <li>Detect and prevent abuse, fraud, or violations of our Terms of Service.</li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>We do not sell your personal data to third parties. Ever.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Data Sharing</h2>
          <p>We share your data only in the following limited circumstances:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>
              <strong>Service providers:</strong> trusted infrastructure partners (database hosting,
              error monitoring via Sentry) who process data solely on our behalf under strict
              data-processing agreements.
            </li>
            <li>
              <strong>Legal requirements:</strong> when required by law, court order, or governmental
              authority.
            </li>
            <li>
              <strong>Public leaderboard:</strong> your username and score are visible to other users
              on the public leaderboard. You can request removal at any time.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Data Retention</h2>
          <p>
            We retain your account and session data for as long as your account is active. If you
            delete your account, we will remove your personal data within 30 days, except where
            retention is required by law or for legitimate security purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Security</h2>
          <p>
            We implement industry-standard security measures including password hashing (bcrypt),
            JWT-based authentication with short-lived access tokens, HTTPS-only transport, and
            rate limiting on sensitive endpoints. However, no system is completely secure — please
            use a strong, unique password for your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Access</strong> the personal data we hold about you.</li>
            <li><strong>Correct</strong> inaccurate or incomplete data.</li>
            <li><strong>Delete</strong> your account and associated personal data.</li>
            <li><strong>Export</strong> your typing session history in a machine-readable format.</li>
            <li><strong>Opt out</strong> of any non-essential data processing.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:typeshala@aipioneerlab.com" className="text-brand-500 hover:underline">
              typeshala@aipioneerlab.com
            </a>.
            We will respond within 30 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">8. Children's Privacy</h2>
          <p>
            The Service is not directed at children under 13 years of age. We do not knowingly
            collect personal information from children under 13. If you believe we have inadvertently
            collected such information, please contact us immediately and we will delete it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered users of
            material changes via email or an in-app notice. The "Last updated" date at the top of
            this page reflects the most recent revision.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">10. Contact</h2>
          <p>
            For any privacy-related questions or requests, please reach out to us at{" "}
            <a href="mailto:typeshala@aipioneerlab.com" className="text-brand-500 hover:underline">
              typeshala@aipioneerlab.com
            </a>
            , or review our{" "}
            <Link to="/terms" className="text-brand-500 hover:underline">Terms of Service</Link>.
          </p>
        </section>

      </div>
    </div>
  );
}
