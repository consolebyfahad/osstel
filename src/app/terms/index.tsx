import LegalDocumentScreen from "@/components/LegalDocumentScreen";
import { TERMS_OF_SERVICE } from "@/content/legal";

export default function TermsOfServiceScreen() {
  return <LegalDocumentScreen document={TERMS_OF_SERVICE} />;
}
