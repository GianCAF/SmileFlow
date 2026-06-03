const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '52';

function normalizePhone(rawPhone) {
  const digits = String(rawPhone || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 10) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  return digits;
}

function toWhatsAppId(rawPhone) {
  const phone = normalizePhone(rawPhone);
  return phone ? `${phone}@c.us` : '';
}

module.exports = {
  normalizePhone,
  toWhatsAppId,
};
