export default function PublishedStandardsPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Published Standards – Child Safety Policy</h1>

      <p style={{ marginBottom: '1rem' }}>
        <strong>App:</strong> Job around me (JAM Mobile)<br />
        <strong>Developer:</strong> JOB AROUND ME SARL-s<br />
        <strong>Package:</strong> com.jam.mobile
      </p>

      <p style={{ marginBottom: '1rem' }}>
        Effective date: February 20, 2026
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>Zero Tolerance for CSAE</h2>
      <p style={{ marginBottom: '1rem' }}>
        Job around me (JAM Mobile) has a strict zero-tolerance policy regarding Child Sexual Abuse and Exploitation (CSAE).
        We explicitly prohibit any content, behavior, or activity that sexually exploits or endangers children.
        This includes, but is not limited to:
      </p>
      <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
        <li>Any imagery, language, or content that sexualizes minors</li>
        <li>Grooming behavior or solicitation of minors</li>
        <li>Sharing, requesting, or distributing child sexual abuse material (CSAM)</li>
        <li>Any attempt to facilitate contact with minors for the purpose of exploitation</li>
        <li>Sextortion or any other form of coercion targeting minors</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>Prevention Measures</h2>
      <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
        <li>User accounts that violate this policy are immediately and permanently suspended.</li>
        <li>Content flagged as potentially harmful to children is reviewed and removed promptly.</li>
        <li>We cooperate fully with law enforcement agencies investigating CSAE.</li>
        <li>We report any identified CSAM to the National Center for Missing &amp; Exploited Children (NCMEC) and relevant authorities.</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>Reporting</h2>
      <p style={{ marginBottom: '1rem' }}>
        If you encounter any content or behavior on Job around me that may endanger children, please report it immediately by contacting us at:{' '}
        <a href="mailto:contact@job-around-me.com" style={{ color: '#2563eb' }}>contact@job-around-me.com</a>.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '0.75rem' }}>Scope</h2>
      <p style={{ marginBottom: '1rem' }}>
        This policy applies to all users, content, and interactions within the Job around me (JAM Mobile) application
        available on Google Play, the Apple App Store, and{' '}
        <a href="https://job-around-me.com" style={{ color: '#2563eb' }}>job-around-me.com</a>.
        Violation of this policy will result in immediate account termination and may be reported to the appropriate authorities.
      </p>

      <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#666' }}>
        &copy; {new Date().getFullYear()} JOB AROUND ME SARL-s – Job around me. All rights reserved.
      </p>
    </div>
  );
}
