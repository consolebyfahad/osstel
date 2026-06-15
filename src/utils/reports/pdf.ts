import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

export async function generatePdfFromHtml(html: string, fileName: string) {
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  return uri;
}

export async function downloadReportPdf(html: string, fileName: string) {
  const safeName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  const uri = await generatePdfFromHtml(html, safeName);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    Alert.alert(
      "PDF ready",
      Platform.OS === "ios"
        ? "PDF was generated on this device."
        : `PDF saved to: ${uri}`,
    );
    return uri;
  }

  await Sharing.shareAsync(uri, {
    UTI: ".pdf",
    mimeType: "application/pdf",
    dialogTitle: "Download report",
  });

  return uri;
}
