import LegalDocumentScreen from "@/components/LegalDocumentScreen";
import { PRIVACY_POLICY } from "@/content/legal";

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen document={PRIVACY_POLICY} />;
}
