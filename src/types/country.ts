export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  example?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export const defaultCountries: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1", example: "(555) 123-4567", minLength: 10, maxLength: 10, pattern: "^[2-9]\\d{2}[2-9]\\d{2}\\d{4}$" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1", example: "(416) 555-1234", minLength: 10, maxLength: 10, pattern: "^[2-9]\\d{2}[2-9]\\d{2}\\d{4}$" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44", example: "20 7946 0958", minLength: 10, maxLength: 11, pattern: "^[1-9]\\d{8,10}$" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61", example: "4 1234 5678", minLength: 9, maxLength: 9, pattern: "^[2-478]\\d{8}$" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49", example: "30 12345678", minLength: 10, maxLength: 12, pattern: "^[1-9]\\d{9,11}$" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33", example: "1 23 45 67 89", minLength: 9, maxLength: 9, pattern: "^[1-9]\\d{8}$" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91", example: "98765 43210", minLength: 10, maxLength: 10, pattern: "^[6-9]\\d{9}$" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81", example: "90 1234 5678", minLength: 10, maxLength: 11, pattern: "^[1-9]\\d{9,10}$" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86", example: "138 0013 8000", minLength: 11, maxLength: 11, pattern: "^1[3-9]\\d{9}$" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55", example: "(11) 99876-5432", minLength: 10, maxLength: 11, pattern: "^[1-9]\\d{9,10}$" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dialCode: "+52", example: "55 1234 5678", minLength: 10, maxLength: 10, pattern: "^[2-9]\\d{9}$" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34", example: "612 34 56 78", minLength: 9, maxLength: 9, pattern: "^[6-9]\\d{8}$" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39", example: "320 123 4567", minLength: 9, maxLength: 11, pattern: "^3\\d{8,10}$" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dialCode: "+31", example: "6 12345678", minLength: 9, maxLength: 9, pattern: "^6\\d{8}$" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", dialCode: "+46", example: "70 123 45 67", minLength: 8, maxLength: 9, pattern: "^7[0-9]\\d{7,8}$" },
  { code: "NO", name: "Norway", flag: "🇳🇴", dialCode: "+47", example: "406 12 345", minLength: 8, maxLength: 8, pattern: "^[49]\\d{7}$" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", dialCode: "+45", example: "20 12 34 56", minLength: 8, maxLength: 8, pattern: "^[2-9]\\d{7}$" },
  { code: "FI", name: "Finland", flag: "🇫🇮", dialCode: "+358", example: "40 123 4567", minLength: 8, maxLength: 9, pattern: "^4[0-9]\\d{7,8}$" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", dialCode: "+41", example: "78 123 45 67", minLength: 9, maxLength: 9, pattern: "^7[5-9]\\d{7}$" },
  { code: "AT", name: "Austria", flag: "🇦🇹", dialCode: "+43", example: "664 123456", minLength: 8, maxLength: 11, pattern: "^6\\d{7,10}$" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", dialCode: "+32", example: "470 12 34 56", minLength: 8, maxLength: 9, pattern: "^4[6-9]\\d{7,8}$" },
  { code: "PL", name: "Poland", flag: "🇵🇱", dialCode: "+48", example: "512 345 678", minLength: 9, maxLength: 9, pattern: "^[4-8]\\d{8}$" },
  { code: "RU", name: "Russia", flag: "🇷🇺", dialCode: "+7", example: "912 345-67-89", minLength: 10, maxLength: 10, pattern: "^9\\d{9}$" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", dialCode: "+82", example: "10-1234-5678", minLength: 9, maxLength: 11, pattern: "^1[0-9]\\d{7,9}$" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dialCode: "+65", example: "8123 4567", minLength: 8, maxLength: 8, pattern: "^[3689]\\d{7}$" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", dialCode: "+852", example: "5123 4567", minLength: 8, maxLength: 8, pattern: "^[2-9]\\d{7}$" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", dialCode: "+886", example: "912 345 678", minLength: 9, maxLength: 9, pattern: "^9\\d{8}$" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", dialCode: "+66", example: "81 234 5678", minLength: 9, maxLength: 9, pattern: "^[6-9]\\d{8}$" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dialCode: "+60", example: "12-345 6789", minLength: 9, maxLength: 10, pattern: "^1[2-9]\\d{7,8}$" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dialCode: "+62", example: "812 3456 789", minLength: 9, maxLength: 12, pattern: "^8\\d{8,11}$" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dialCode: "+63", example: "917 123 4567", minLength: 10, maxLength: 10, pattern: "^9\\d{9}$" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", dialCode: "+84", example: "91 234 56 78", minLength: 9, maxLength: 10, pattern: "^[3-9]\\d{8,9}$" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27", example: "82 123 4567", minLength: 9, maxLength: 9, pattern: "^[1-8]\\d{8}$" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20", example: "100 123 4567", minLength: 10, maxLength: 10, pattern: "^1\\d{9}$" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234", example: "802 123 4567", minLength: 10, maxLength: 10, pattern: "^[7-9]\\d{9}$" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254", example: "712 345 678", minLength: 9, maxLength: 9, pattern: "^7\\d{8}$" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233", example: "23 123 4567", minLength: 9, maxLength: 9, pattern: "^[2-5]\\d{8}$" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54", example: "11 1234-5678", minLength: 10, maxLength: 10, pattern: "^[1-9]\\d{9}$" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56", example: "9 8765 4321", minLength: 8, maxLength: 9, pattern: "^[2-9]\\d{7,8}$" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57", example: "300 123 4567", minLength: 10, maxLength: 10, pattern: "^3\\d{9}$" },
  { code: "PE", name: "Peru", flag: "🇵🇪", dialCode: "+51", example: "987 654 321", minLength: 9, maxLength: 9, pattern: "^9\\d{8}$" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", dialCode: "+598", example: "99 123 456", minLength: 8, maxLength: 8, pattern: "^9\\d{7}$" },
  { code: "IL", name: "Israel", flag: "🇮🇱", dialCode: "+972", example: "50-123-4567", minLength: 9, maxLength: 9, pattern: "^5\\d{8}$" },
  { code: "AE", name: "UAE", flag: "🇦🇪", dialCode: "+971", example: "50 123 4567", minLength: 9, maxLength: 9, pattern: "^5\\d{8}$" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966", example: "50 123 4567", minLength: 9, maxLength: 9, pattern: "^5\\d{8}$" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", dialCode: "+90", example: "532 123 45 67", minLength: 10, maxLength: 10, pattern: "^5\\d{9}$" },
  { code: "GR", name: "Greece", flag: "🇬🇷", dialCode: "+30", example: "694 123 4567", minLength: 10, maxLength: 10, pattern: "^6\\d{9}$" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dialCode: "+351", example: "912 345 678", minLength: 9, maxLength: 9, pattern: "^9[1236]\\d{7}$" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", dialCode: "+353", example: "85 123 4567", minLength: 9, maxLength: 9, pattern: "^8[356]\\d{7}$" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dialCode: "+64", example: "21 123 4567", minLength: 8, maxLength: 9, pattern: "^2[0-9]\\d{6,7}$" },
];