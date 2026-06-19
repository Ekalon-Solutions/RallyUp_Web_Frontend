const DEFAULT_SUPPORT_NUMBER = '919999999999';

function normalizeWhatsAppNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function getVendorSupportWhatsAppNumber(): string {
  const fromEnv = process.env.NEXT_PUBLIC_VENDOR_SUPPORT_WHATSAPP;
  return normalizeWhatsAppNumber(fromEnv || DEFAULT_SUPPORT_NUMBER);
}

export function buildVendorSupportWhatsAppUrl(options?: {
  vendorName?: string;
  phoneNumber?: string;
  issue?: string;
}): string {
  const supportNumber = getVendorSupportWhatsAppNumber();
  const lines = [
    'Hi RallyUp Support,',
    'I need help with the bouncer / vendor scanner app.',
  ];
  if (options?.vendorName) lines.push(`Name: ${options.vendorName}`);
  if (options?.phoneNumber) lines.push(`Phone: ${options.phoneNumber}`);
  if (options?.issue) lines.push(`Issue: ${options.issue}`);
  lines.push('Sent from Vendor Login');

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${supportNumber}?text=${text}`;
}

export function openVendorSupportWhatsApp(options?: {
  vendorName?: string;
  phoneNumber?: string;
  issue?: string;
}): void {
  if (typeof window === 'undefined') return;
  window.open(buildVendorSupportWhatsAppUrl(options), '_blank', 'noopener,noreferrer');
}
