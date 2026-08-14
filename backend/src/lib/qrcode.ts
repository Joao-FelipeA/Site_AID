import QRCode from "qrcode";
import { randomUUID } from "crypto";

/** Token unico embutido no QR code de uma aula. */
export function gerarTokenQrCode(): string {
  return randomUUID();
}

/** Gera o QR code (data URL PNG base64) que codifica o token da aula. */
export function gerarQrCodeDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 2 });
}
