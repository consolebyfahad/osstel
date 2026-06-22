export type LegalSection = {
  title: string;
  body: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  contactEmail: string;
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: "June 12, 2026",
  intro:
    "OSSTEL (“we”, “our”, or “us”) operates a hostel and property management platform for managers and residents. This Privacy Policy explains how we collect, use, store, and protect your information when you use the OSSTEL mobile application and related services.",
  contactEmail: "admin.osstel@gmail.com",
  sections: [
    {
      title: "Information We Collect",
      body: [
        "We collect information you provide directly and information generated when you use OSSTEL.",
      ],
      bullets: [
        "Account details: name, phone number, email, password, and role (manager or resident).",
        "Profile information: address, date of birth, CNIC, and profile photo.",
        "Property data: hostel details, rooms, rent records, and occupancy information.",
        "Resident records: emergency contacts, CNIC images, and tenancy details added by managers.",
        "Support messages and subscription or plan upgrade requests sent to our admin team.",
        "Device and usage data such as app interactions needed to operate and secure the service.",
      ],
    },
    {
      title: "How We Use Your Information",
      body: ["We use your information to provide and improve OSSTEL, including to:"],
      bullets: [
        "Create and manage your account and authenticate your access.",
        "Enable managers to operate hostels, rooms, rent, complaints, and residents.",
        "Display relevant information to residents about their stay and hostel.",
        "Process subscription requests and respond to support inquiries.",
        "Send service-related notifications and maintain platform security.",
        "Comply with legal obligations and enforce our Terms of Service.",
      ],
    },
    {
      title: "How Information Is Shared",
      body: [
        "We do not sell your personal information. Information may be shared only as described below.",
      ],
      bullets: [
        "Managers can access resident and hostel data for properties they manage.",
        "Residents can access information related to their assigned hostel and room.",
        "Service providers that help us host, secure, or operate the platform under confidentiality obligations.",
        "Authorities when required by law or to protect the rights, safety, and security of users.",
      ],
    },
    {
      title: "Data Retention",
      body: [
        "We retain your information for as long as your account is active or as needed to provide OSSTEL services, resolve disputes, enforce agreements, and meet legal requirements. You may request account deletion subject to applicable law and legitimate business needs such as financial record keeping.",
      ],
    },
    {
      title: "Security",
      body: [
        "We use reasonable administrative, technical, and organizational measures to protect your information, including encrypted connections and access controls. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
      ],
    },
    {
      title: "Your Choices and Rights",
      body: ["Depending on your location and applicable law, you may have the right to:"],
      bullets: [
        "Access and update profile information through the app.",
        "Request correction of inaccurate data.",
        "Request deletion of your account, subject to legal and operational limits.",
        "Withdraw consent where processing is based on consent, where applicable.",
      ],
    },
    {
      title: "Children's Privacy",
      body: [
        "OSSTEL is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us data, contact us so we can take appropriate action.",
      ],
    },
    {
      title: "Changes to This Policy",
      body: [
        "We may update this Privacy Policy from time to time. When we do, we will revise the “Last updated” date above. Continued use of OSSTEL after changes become effective means you accept the updated policy.",
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: "June 12, 2026",
  intro:
    "These Terms of Service (“Terms”) govern your access to and use of the OSSTEL mobile application and related services. By creating an account or using OSSTEL, you agree to these Terms.",
  contactEmail: "admin.osstel@gmail.com",
  sections: [
    {
      title: "Eligibility and Accounts",
      body: [
        "You must be at least 18 years old and able to enter a binding agreement to use OSSTEL. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Provide accurate information and notify us promptly of unauthorized access.",
      ],
    },
    {
      title: "Roles and Responsibilities",
      body: ["OSSTEL supports different user roles with distinct permissions."],
      bullets: [
        "Managers may create and manage hostels, rooms, residents, rent records, and related operations for properties they control.",
        "Residents may access information and features related to their assigned stay.",
        "You may not access data or features outside the permissions granted to your role.",
      ],
    },
    {
      title: "Acceptable Use",
      body: ["You agree not to misuse OSSTEL. Prohibited conduct includes:"],
      bullets: [
        "Uploading false, misleading, or unlawful information.",
        "Attempting to access accounts, data, or systems without authorization.",
        "Interfering with platform security, performance, or other users.",
        "Using OSSTEL for fraud, harassment, or any illegal purpose.",
        "Reverse engineering or copying the service except as permitted by law.",
      ],
    },
    {
      title: "Hostel and Resident Data",
      body: [
        "Managers are responsible for the accuracy of hostel, room, rent, and resident records they enter. Managers must have a lawful basis to collect and store resident information, including CNIC and identity documents, and must use such data only for legitimate property management purposes.",
      ],
    },
    {
      title: "Subscriptions and Payments",
      body: [
        "Some manager features may require a paid subscription plan. Plan details, pricing, and limits are shown in the app. Upgrade requests may require manual review and approval by OSSTEL administrators. Fees paid are subject to the billing terms communicated at the time of purchase unless otherwise required by law.",
      ],
    },
    {
      title: "Intellectual Property",
      body: [
        "OSSTEL, including its software, branding, and content provided by us, is owned by us or our licensors and protected by applicable intellectual property laws. You receive a limited, non-exclusive, non-transferable license to use the app for its intended purpose while your account remains in good standing.",
      ],
    },
    {
      title: "Disclaimer of Warranties",
      body: [
        "OSSTEL is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, we disclaim all warranties, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee uninterrupted or error-free operation.",
      ],
    },
    {
      title: "Limitation of Liability",
      body: [
        "To the fullest extent permitted by law, OSSTEL and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill arising from your use of the service. Our total liability for any claim relating to OSSTEL will not exceed the amount you paid us, if any, in the twelve months before the event giving rise to the claim.",
      ],
    },
    {
      title: "Suspension and Termination",
      body: [
        "We may suspend or terminate access to OSSTEL if you violate these Terms, create security or legal risk, or if required for operational or legal reasons. You may stop using the service at any time. Provisions that by nature should survive termination will remain in effect.",
      ],
    },
    {
      title: "Governing Law",
      body: [
        "These Terms are governed by the laws of Pakistan, without regard to conflict of law principles, except where mandatory local consumer protection laws apply.",
      ],
    },
    {
      title: "Changes to These Terms",
      body: [
        "We may modify these Terms from time to time. Material changes will be reflected by updating the “Last updated” date. Your continued use of OSSTEL after changes take effect constitutes acceptance of the revised Terms.",
      ],
    },
  ],
};
