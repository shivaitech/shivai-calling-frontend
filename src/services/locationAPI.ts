// Location data and API for countries, states, and cities
// This uses a public API for location data

export interface Country {
  code: string;
  name: string;
  capital?: string;
  currency?: string;
  phoneCode?: string;
  continent?: string;
  timezone?: string;
  flag?: string;
}

export interface State {
  code: string;
  name: string;
  countryCode: string;
  capital?: string;
}

export interface City {
  name: string;
  stateCode: string;
  countryCode: string;
  population?: number;
  isCapital?: boolean;
}

// Popular countries list with enhanced metadata
export const popularCountries: Country[] = [
  { code: "AF", name: "Afghanistan", capital: "Kabul", currency: "AFN", phoneCode: "+93", continent: "Asia", timezone: "UTC+4:30", flag: "🇦🇫" },
  { code: "AL", name: "Albania", capital: "Tirana", currency: "ALL", phoneCode: "+355", continent: "Europe", timezone: "UTC+1", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", capital: "Algiers", currency: "DZD", phoneCode: "+213", continent: "Africa", timezone: "UTC+1", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", capital: "Andorra la Vella", currency: "EUR", phoneCode: "+376", continent: "Europe", timezone: "UTC+1", flag: "🇦🇩" },
  { code: "AO", name: "Angola", capital: "Luanda", currency: "AOA", phoneCode: "+244", continent: "Africa", timezone: "UTC+1", flag: "🇦🇴" },
  { code: "AR", name: "Argentina", capital: "Buenos Aires", currency: "ARS", phoneCode: "+54", continent: "South America", timezone: "UTC-3", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", capital: "Yerevan", currency: "AMD", phoneCode: "+374", continent: "Asia", timezone: "UTC+4", flag: "🇦🇲" },
  { code: "AU", name: "Australia", capital: "Canberra", currency: "AUD", phoneCode: "+61", continent: "Oceania", timezone: "UTC+10", flag: "🇦🇺" },
  { code: "AT", name: "Austria", capital: "Vienna", currency: "EUR", phoneCode: "+43", continent: "Europe", timezone: "UTC+1", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", capital: "Baku", currency: "AZN", phoneCode: "+994", continent: "Asia", timezone: "UTC+4", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", capital: "Nassau", currency: "BSD", phoneCode: "+1-242", continent: "North America", timezone: "UTC-5", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", capital: "Manama", currency: "BHD", phoneCode: "+973", continent: "Asia", timezone: "UTC+3", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", capital: "Dhaka", currency: "BDT", phoneCode: "+880", continent: "Asia", timezone: "UTC+6", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", capital: "Bridgetown", currency: "BBD", phoneCode: "+1-246", continent: "North America", timezone: "UTC-4", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", capital: "Minsk", currency: "BYN", phoneCode: "+375", continent: "Europe", timezone: "UTC+3", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", capital: "Brussels", currency: "EUR", phoneCode: "+32", continent: "Europe", timezone: "UTC+1", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", capital: "Belmopan", currency: "BZD", phoneCode: "+501", continent: "North America", timezone: "UTC-6", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", capital: "Porto-Novo", currency: "XOF", phoneCode: "+229", continent: "Africa", timezone: "UTC+1", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", capital: "Thimphu", currency: "BTN", phoneCode: "+975", continent: "Asia", timezone: "UTC+6", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", capital: "Sucre", currency: "BOB", phoneCode: "+591", continent: "South America", timezone: "UTC-4", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", capital: "Sarajevo", currency: "BAM", phoneCode: "+387", continent: "Europe", timezone: "UTC+1", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", capital: "Gaborone", currency: "BWP", phoneCode: "+267", continent: "Africa", timezone: "UTC+2", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", capital: "Brasília", currency: "BRL", phoneCode: "+55", continent: "South America", timezone: "UTC-3", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", capital: "Bandar Seri Begawan", currency: "BND", phoneCode: "+673", continent: "Asia", timezone: "UTC+8", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", capital: "Sofia", currency: "BGN", phoneCode: "+359", continent: "Europe", timezone: "UTC+2", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", capital: "Ouagadougou", currency: "XOF", phoneCode: "+226", continent: "Africa", timezone: "UTC", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", capital: "Gitega", currency: "BIF", phoneCode: "+257", continent: "Africa", timezone: "UTC+2", flag: "🇧🇮" },
  { code: "KH", name: "Cambodia", capital: "Phnom Penh", currency: "KHR", phoneCode: "+855", continent: "Asia", timezone: "UTC+7", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", capital: "Yaoundé", currency: "XAF", phoneCode: "+237", continent: "Africa", timezone: "UTC+1", flag: "🇨🇲" },
  { code: "CA", name: "Canada", capital: "Ottawa", currency: "CAD", phoneCode: "+1", continent: "North America", timezone: "UTC-5", flag: "🇨🇦" },
  { code: "CV", name: "Cape Verde", capital: "Praia", currency: "CVE", phoneCode: "+238", continent: "Africa", timezone: "UTC-1", flag: "🇨🇻" },
  { code: "CF", name: "Central African Republic", capital: "Bangui", currency: "XAF", phoneCode: "+236", continent: "Africa", timezone: "UTC+1", flag: "🇨🇫" },
  { code: "TD", name: "Chad", capital: "N'Djamena", currency: "XAF", phoneCode: "+235", continent: "Africa", timezone: "UTC+1", flag: "🇹🇩" },
  { code: "CL", name: "Chile", capital: "Santiago", currency: "CLP", phoneCode: "+56", continent: "South America", timezone: "UTC-4", flag: "🇨🇱" },
  { code: "CN", name: "China", capital: "Beijing", currency: "CNY", phoneCode: "+86", continent: "Asia", timezone: "UTC+8", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", capital: "Bogotá", currency: "COP", phoneCode: "+57", continent: "South America", timezone: "UTC-5", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", capital: "Moroni", currency: "KMF", phoneCode: "+269", continent: "Africa", timezone: "UTC+3", flag: "🇰🇲" },
  { code: "CG", name: "Congo", capital: "Brazzaville", currency: "XAF", phoneCode: "+242", continent: "Africa", timezone: "UTC+1", flag: "🇨🇬" },
  { code: "CR", name: "Costa Rica", capital: "San José", currency: "CRC", phoneCode: "+506", continent: "North America", timezone: "UTC-6", flag: "🇨🇷" },
  { code: "HR", name: "Croatia", capital: "Zagreb", currency: "EUR", phoneCode: "+385", continent: "Europe", timezone: "UTC+1", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", capital: "Havana", currency: "CUP", phoneCode: "+53", continent: "North America", timezone: "UTC-5", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", capital: "Nicosia", currency: "EUR", phoneCode: "+357", continent: "Europe", timezone: "UTC+2", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", capital: "Prague", currency: "CZK", phoneCode: "+420", continent: "Europe", timezone: "UTC+1", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", capital: "Copenhagen", currency: "DKK", phoneCode: "+45", continent: "Europe", timezone: "UTC+1", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", capital: "Djibouti", currency: "DJF", phoneCode: "+253", continent: "Africa", timezone: "UTC+3", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", capital: "Roseau", currency: "XCD", phoneCode: "+1-767", continent: "North America", timezone: "UTC-4", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", capital: "Santo Domingo", currency: "DOP", phoneCode: "+1-809", continent: "North America", timezone: "UTC-4", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", capital: "Quito", currency: "USD", phoneCode: "+593", continent: "South America", timezone: "UTC-5", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", capital: "Cairo", currency: "EGP", phoneCode: "+20", continent: "Africa", timezone: "UTC+2", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", capital: "San Salvador", currency: "USD", phoneCode: "+503", continent: "North America", timezone: "UTC-6", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", capital: "Malabo", currency: "XAF", phoneCode: "+240", continent: "Africa", timezone: "UTC+1", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", capital: "Asmara", currency: "ERN", phoneCode: "+291", continent: "Africa", timezone: "UTC+3", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", capital: "Tallinn", currency: "EUR", phoneCode: "+372", continent: "Europe", timezone: "UTC+2", flag: "🇪🇪" },
  { code: "ET", name: "Ethiopia", capital: "Addis Ababa", currency: "ETB", phoneCode: "+251", continent: "Africa", timezone: "UTC+3", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", capital: "Suva", currency: "FJD", phoneCode: "+679", continent: "Oceania", timezone: "UTC+12", flag: "🇫🇯" },
  { code: "FI", name: "Finland", capital: "Helsinki", currency: "EUR", phoneCode: "+358", continent: "Europe", timezone: "UTC+2", flag: "🇫🇮" },
  { code: "FR", name: "France", capital: "Paris", currency: "EUR", phoneCode: "+33", continent: "Europe", timezone: "UTC+1", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", capital: "Libreville", currency: "XAF", phoneCode: "+241", continent: "Africa", timezone: "UTC+1", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", capital: "Banjul", currency: "GMD", phoneCode: "+220", continent: "Africa", timezone: "UTC", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", capital: "Tbilisi", currency: "GEL", phoneCode: "+995", continent: "Asia", timezone: "UTC+4", flag: "🇬🇪" },
  { code: "DE", name: "Germany", capital: "Berlin", currency: "EUR", phoneCode: "+49", continent: "Europe", timezone: "UTC+1", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", capital: "Accra", currency: "GHS", phoneCode: "+233", continent: "Africa", timezone: "UTC", flag: "🇬🇭" },
  { code: "GR", name: "Greece", capital: "Athens", currency: "EUR", phoneCode: "+30", continent: "Europe", timezone: "UTC+2", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", capital: "St. George's", currency: "XCD", phoneCode: "+1-473", continent: "North America", timezone: "UTC-4", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", capital: "Guatemala City", currency: "GTQ", phoneCode: "+502", continent: "North America", timezone: "UTC-6", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", capital: "Conakry", currency: "GNF", phoneCode: "+224", continent: "Africa", timezone: "UTC", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", capital: "Bissau", currency: "XOF", phoneCode: "+245", continent: "Africa", timezone: "UTC", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", capital: "Georgetown", currency: "GYD", phoneCode: "+592", continent: "South America", timezone: "UTC-4", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", capital: "Port-au-Prince", currency: "HTG", phoneCode: "+509", continent: "North America", timezone: "UTC-5", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", capital: "Tegucigalpa", currency: "HNL", phoneCode: "+504", continent: "North America", timezone: "UTC-6", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", capital: "Budapest", currency: "HUF", phoneCode: "+36", continent: "Europe", timezone: "UTC+1", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", capital: "Reykjavik", currency: "ISK", phoneCode: "+354", continent: "Europe", timezone: "UTC", flag: "🇮🇸" },
  { code: "IN", name: "India", capital: "New Delhi", currency: "INR", phoneCode: "+91", continent: "Asia", timezone: "UTC+5:30", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", capital: "Jakarta", currency: "IDR", phoneCode: "+62", continent: "Asia", timezone: "UTC+7", flag: "🇮🇩" },
  { code: "IR", name: "Iran", capital: "Tehran", currency: "IRR", phoneCode: "+98", continent: "Asia", timezone: "UTC+3:30", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", capital: "Baghdad", currency: "IQD", phoneCode: "+964", continent: "Asia", timezone: "UTC+3", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", capital: "Dublin", currency: "EUR", phoneCode: "+353", continent: "Europe", timezone: "UTC", flag: "🇮🇪" },
  { code: "IL", name: "Israel", capital: "Jerusalem", currency: "ILS", phoneCode: "+972", continent: "Asia", timezone: "UTC+2", flag: "🇮🇱" },
  { code: "IT", name: "Italy", capital: "Rome", currency: "EUR", phoneCode: "+39", continent: "Europe", timezone: "UTC+1", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", capital: "Kingston", currency: "JMD", phoneCode: "+1-876", continent: "North America", timezone: "UTC-5", flag: "🇯🇲" },
  { code: "JP", name: "Japan", capital: "Tokyo", currency: "JPY", phoneCode: "+81", continent: "Asia", timezone: "UTC+9", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", capital: "Amman", currency: "JOD", phoneCode: "+962", continent: "Asia", timezone: "UTC+2", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", capital: "Nur-Sultan", currency: "KZT", phoneCode: "+7", continent: "Asia", timezone: "UTC+6", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", capital: "Nairobi", currency: "KES", phoneCode: "+254", continent: "Africa", timezone: "UTC+3", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", capital: "Tarawa", currency: "AUD", phoneCode: "+686", continent: "Oceania", timezone: "UTC+12", flag: "🇰🇮" },
  { code: "KW", name: "Kuwait", capital: "Kuwait City", currency: "KWD", phoneCode: "+965", continent: "Asia", timezone: "UTC+3", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", capital: "Bishkek", currency: "KGS", phoneCode: "+996", continent: "Asia", timezone: "UTC+6", flag: "🇰🇬" },
  { code: "LA", name: "Laos", capital: "Vientiane", currency: "LAK", phoneCode: "+856", continent: "Asia", timezone: "UTC+7", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", capital: "Riga", currency: "EUR", phoneCode: "+371", continent: "Europe", timezone: "UTC+2", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", capital: "Beirut", currency: "LBP", phoneCode: "+961", continent: "Asia", timezone: "UTC+2", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", capital: "Maseru", currency: "LSL", phoneCode: "+266", continent: "Africa", timezone: "UTC+2", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", capital: "Monrovia", currency: "LRD", phoneCode: "+231", continent: "Africa", timezone: "UTC", flag: "🇱🇷" },
  { code: "LY", name: "Libya", capital: "Tripoli", currency: "LYD", phoneCode: "+218", continent: "Africa", timezone: "UTC+2", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", capital: "Vaduz", currency: "CHF", phoneCode: "+423", continent: "Europe", timezone: "UTC+1", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", capital: "Vilnius", currency: "EUR", phoneCode: "+370", continent: "Europe", timezone: "UTC+2", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", capital: "Luxembourg City", currency: "EUR", phoneCode: "+352", continent: "Europe", timezone: "UTC+1", flag: "🇱🇺" },
  { code: "MG", name: "Madagascar", capital: "Antananarivo", currency: "MGA", phoneCode: "+261", continent: "Africa", timezone: "UTC+3", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", capital: "Lilongwe", currency: "MWK", phoneCode: "+265", continent: "Africa", timezone: "UTC+2", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", capital: "Kuala Lumpur", currency: "MYR", phoneCode: "+60", continent: "Asia", timezone: "UTC+8", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", capital: "Malé", currency: "MVR", phoneCode: "+960", continent: "Asia", timezone: "UTC+5", flag: "🇲🇻" },
  { code: "ML", name: "Mali", capital: "Bamako", currency: "XOF", phoneCode: "+223", continent: "Africa", timezone: "UTC", flag: "🇲🇱" },
  { code: "MT", name: "Malta", capital: "Valletta", currency: "EUR", phoneCode: "+356", continent: "Europe", timezone: "UTC+1", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", capital: "Majuro", currency: "USD", phoneCode: "+692", continent: "Oceania", timezone: "UTC+12", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", capital: "Nouakchott", currency: "MRU", phoneCode: "+222", continent: "Africa", timezone: "UTC", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", capital: "Port Louis", currency: "MUR", phoneCode: "+230", continent: "Africa", timezone: "UTC+4", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", capital: "Mexico City", currency: "MXN", phoneCode: "+52", continent: "North America", timezone: "UTC-6", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", capital: "Palikir", currency: "USD", phoneCode: "+691", continent: "Oceania", timezone: "UTC+11", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", capital: "Chișinău", currency: "MDL", phoneCode: "+373", continent: "Europe", timezone: "UTC+2", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", capital: "Monaco", currency: "EUR", phoneCode: "+377", continent: "Europe", timezone: "UTC+1", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", capital: "Ulaanbaatar", currency: "MNT", phoneCode: "+976", continent: "Asia", timezone: "UTC+8", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", capital: "Podgorica", currency: "EUR", phoneCode: "+382", continent: "Europe", timezone: "UTC+1", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", capital: "Rabat", currency: "MAD", phoneCode: "+212", continent: "Africa", timezone: "UTC", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", capital: "Maputo", currency: "MZN", phoneCode: "+258", continent: "Africa", timezone: "UTC+2", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", capital: "Naypyidaw", currency: "MMK", phoneCode: "+95", continent: "Asia", timezone: "UTC+6:30", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", capital: "Windhoek", currency: "NAD", phoneCode: "+264", continent: "Africa", timezone: "UTC+2", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", capital: "Yaren", currency: "AUD", phoneCode: "+674", continent: "Oceania", timezone: "UTC+12", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", capital: "Kathmandu", currency: "NPR", phoneCode: "+977", continent: "Asia", timezone: "UTC+5:45", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", capital: "Amsterdam", currency: "EUR", phoneCode: "+31", continent: "Europe", timezone: "UTC+1", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", capital: "Wellington", currency: "NZD", phoneCode: "+64", continent: "Oceania", timezone: "UTC+12", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", capital: "Managua", currency: "NIO", phoneCode: "+505", continent: "North America", timezone: "UTC-6", flag: "🇳🇮" },
  { code: "NE", name: "Niger", capital: "Niamey", currency: "XOF", phoneCode: "+227", continent: "Africa", timezone: "UTC+1", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", capital: "Abuja", currency: "NGN", phoneCode: "+234", continent: "Africa", timezone: "UTC+1", flag: "🇳🇬" },
  { code: "KP", name: "North Korea", capital: "Pyongyang", currency: "KPW", phoneCode: "+850", continent: "Asia", timezone: "UTC+9", flag: "🇰🇵" },
  { code: "MK", name: "North Macedonia", capital: "Skopje", currency: "MKD", phoneCode: "+389", continent: "Europe", timezone: "UTC+1", flag: "🇲🇰" },
  { code: "NO", name: "Norway", capital: "Oslo", currency: "NOK", phoneCode: "+47", continent: "Europe", timezone: "UTC+1", flag: "🇳🇴" },
  { code: "OM", name: "Oman", capital: "Muscat", currency: "OMR", phoneCode: "+968", continent: "Asia", timezone: "UTC+4", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", capital: "Islamabad", currency: "PKR", phoneCode: "+92", continent: "Asia", timezone: "UTC+5", flag: "🇵🇰" },
  { code: "PW", name: "Palau", capital: "Ngerulmud", currency: "USD", phoneCode: "+680", continent: "Oceania", timezone: "UTC+9", flag: "🇵🇼" },
  { code: "PA", name: "Panama", capital: "Panama City", currency: "PAB", phoneCode: "+507", continent: "North America", timezone: "UTC-5", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", capital: "Port Moresby", currency: "PGK", phoneCode: "+675", continent: "Oceania", timezone: "UTC+10", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", capital: "Asunción", currency: "PYG", phoneCode: "+595", continent: "South America", timezone: "UTC-4", flag: "🇵🇾" },
  { code: "PE", name: "Peru", capital: "Lima", currency: "PEN", phoneCode: "+51", continent: "South America", timezone: "UTC-5", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", capital: "Manila", currency: "PHP", phoneCode: "+63", continent: "Asia", timezone: "UTC+8", flag: "🇵🇭" },
  { code: "PL", name: "Poland", capital: "Warsaw", currency: "PLN", phoneCode: "+48", continent: "Europe", timezone: "UTC+1", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", capital: "Lisbon", currency: "EUR", phoneCode: "+351", continent: "Europe", timezone: "UTC", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", capital: "Doha", currency: "QAR", phoneCode: "+974", continent: "Asia", timezone: "UTC+3", flag: "🇶🇦" },
  { code: "RO", name: "Romania", capital: "Bucharest", currency: "RON", phoneCode: "+40", continent: "Europe", timezone: "UTC+2", flag: "🇷🇴" },
  { code: "RU", name: "Russia", capital: "Moscow", currency: "RUB", phoneCode: "+7", continent: "Europe", timezone: "UTC+3", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", capital: "Kigali", currency: "RWF", phoneCode: "+250", continent: "Africa", timezone: "UTC+2", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts and Nevis", capital: "Basseterre", currency: "XCD", phoneCode: "+1-869", continent: "North America", timezone: "UTC-4", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", capital: "Castries", currency: "XCD", phoneCode: "+1-758", continent: "North America", timezone: "UTC-4", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent and the Grenadines", capital: "Kingstown", currency: "XCD", phoneCode: "+1-784", continent: "North America", timezone: "UTC-4", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", capital: "Apia", currency: "WST", phoneCode: "+685", continent: "Oceania", timezone: "UTC+13", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", capital: "San Marino", currency: "EUR", phoneCode: "+378", continent: "Europe", timezone: "UTC+1", flag: "🇸🇲" },
  { code: "ST", name: "Sao Tome and Principe", capital: "São Tomé", currency: "STN", phoneCode: "+239", continent: "Africa", timezone: "UTC", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", capital: "Riyadh", currency: "SAR", phoneCode: "+966", continent: "Asia", timezone: "UTC+3", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", capital: "Dakar", currency: "XOF", phoneCode: "+221", continent: "Africa", timezone: "UTC", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", capital: "Belgrade", currency: "RSD", phoneCode: "+381", continent: "Europe", timezone: "UTC+1", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", capital: "Victoria", currency: "SCR", phoneCode: "+248", continent: "Africa", timezone: "UTC+4", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", capital: "Freetown", currency: "SLL", phoneCode: "+232", continent: "Africa", timezone: "UTC", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", capital: "Singapore", currency: "SGD", phoneCode: "+65", continent: "Asia", timezone: "UTC+8", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", capital: "Bratislava", currency: "EUR", phoneCode: "+421", continent: "Europe", timezone: "UTC+1", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", capital: "Ljubljana", currency: "EUR", phoneCode: "+386", continent: "Europe", timezone: "UTC+1", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", capital: "Honiara", currency: "SBD", phoneCode: "+677", continent: "Oceania", timezone: "UTC+11", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", capital: "Mogadishu", currency: "SOS", phoneCode: "+252", continent: "Africa", timezone: "UTC+3", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", capital: "Pretoria", currency: "ZAR", phoneCode: "+27", continent: "Africa", timezone: "UTC+2", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", capital: "Seoul", currency: "KRW", phoneCode: "+82", continent: "Asia", timezone: "UTC+9", flag: "🇰🇷" },
  { code: "SS", name: "South Sudan", capital: "Juba", currency: "SSP", phoneCode: "+211", continent: "Africa", timezone: "UTC+3", flag: "🇸🇸" },
  { code: "ES", name: "Spain", capital: "Madrid", currency: "EUR", phoneCode: "+34", continent: "Europe", timezone: "UTC+1", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", capital: "Colombo", currency: "LKR", phoneCode: "+94", continent: "Asia", timezone: "UTC+5:30", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", capital: "Khartoum", currency: "SDG", phoneCode: "+249", continent: "Africa", timezone: "UTC+2", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", capital: "Paramaribo", currency: "SRD", phoneCode: "+597", continent: "South America", timezone: "UTC-3", flag: "🇸🇷" },
  { code: "SE", name: "Sweden", capital: "Stockholm", currency: "SEK", phoneCode: "+46", continent: "Europe", timezone: "UTC+1", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", capital: "Bern", currency: "CHF", phoneCode: "+41", continent: "Europe", timezone: "UTC+1", flag: "🇨🇭" },
  { code: "SY", name: "Syria", capital: "Damascus", currency: "SYP", phoneCode: "+963", continent: "Asia", timezone: "UTC+2", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", capital: "Taipei", currency: "TWD", phoneCode: "+886", continent: "Asia", timezone: "UTC+8", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", capital: "Dushanbe", currency: "TJS", phoneCode: "+992", continent: "Asia", timezone: "UTC+5", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", capital: "Dodoma", currency: "TZS", phoneCode: "+255", continent: "Africa", timezone: "UTC+3", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", capital: "Bangkok", currency: "THB", phoneCode: "+66", continent: "Asia", timezone: "UTC+7", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", capital: "Dili", currency: "USD", phoneCode: "+670", continent: "Asia", timezone: "UTC+9", flag: "🇹🇱" },
  { code: "TG", name: "Togo", capital: "Lomé", currency: "XOF", phoneCode: "+228", continent: "Africa", timezone: "UTC", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", capital: "Nuku'alofa", currency: "TOP", phoneCode: "+676", continent: "Oceania", timezone: "UTC+13", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", capital: "Port of Spain", currency: "TTD", phoneCode: "+1-868", continent: "North America", timezone: "UTC-4", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", capital: "Tunis", currency: "TND", phoneCode: "+216", continent: "Africa", timezone: "UTC+1", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", capital: "Ankara", currency: "TRY", phoneCode: "+90", continent: "Asia", timezone: "UTC+3", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", capital: "Ashgabat", currency: "TMT", phoneCode: "+993", continent: "Asia", timezone: "UTC+5", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", capital: "Funafuti", currency: "AUD", phoneCode: "+688", continent: "Oceania", timezone: "UTC+12", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", capital: "Kampala", currency: "UGX", phoneCode: "+256", continent: "Africa", timezone: "UTC+3", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", capital: "Kyiv", currency: "UAH", phoneCode: "+380", continent: "Europe", timezone: "UTC+2", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", capital: "Abu Dhabi", currency: "AED", phoneCode: "+971", continent: "Asia", timezone: "UTC+4", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", capital: "London", currency: "GBP", phoneCode: "+44", continent: "Europe", timezone: "UTC", flag: "🇬🇧" },
  { code: "US", name: "United States", capital: "Washington D.C.", currency: "USD", phoneCode: "+1", continent: "North America", timezone: "UTC-5", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", capital: "Montevideo", currency: "UYU", phoneCode: "+598", continent: "South America", timezone: "UTC-3", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", capital: "Tashkent", currency: "UZS", phoneCode: "+998", continent: "Asia", timezone: "UTC+5", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", capital: "Port Vila", currency: "VUV", phoneCode: "+678", continent: "Oceania", timezone: "UTC+11", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", capital: "Vatican City", currency: "EUR", phoneCode: "+39", continent: "Europe", timezone: "UTC+1", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", capital: "Caracas", currency: "VES", phoneCode: "+58", continent: "South America", timezone: "UTC-4", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", capital: "Hanoi", currency: "VND", phoneCode: "+84", continent: "Asia", timezone: "UTC+7", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", capital: "Sana'a", currency: "YER", phoneCode: "+967", continent: "Asia", timezone: "UTC+3", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", capital: "Lusaka", currency: "ZMW", phoneCode: "+260", continent: "Africa", timezone: "UTC+2", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", capital: "Harare", currency: "ZWL", phoneCode: "+263", continent: "Africa", timezone: "UTC+2", flag: "🇿🇼" },
];

// Sample states/provinces data (this would ideally come from an API)
export const statesData: Record<string, State[]> = {
  AF: [
    { code: "BAL", name: "Balkh", countryCode: "AF", capital: "Mazar-i-Sharif" },
    { code: "BAM", name: "Bamyan", countryCode: "AF", capital: "Bamyan" },
    { code: "BDG", name: "Badghis", countryCode: "AF", capital: "Qala-e-Naw" },
    { code: "BDS", name: "Badakhshan", countryCode: "AF", capital: "Fayzabad" },
    { code: "BGL", name: "Baghlan", countryCode: "AF", capital: "Puli Khumri" },
    { code: "DAY", name: "Daykundi", countryCode: "AF", capital: "Nili" },
    { code: "FRA", name: "Farah", countryCode: "AF", capital: "Farah" },
    { code: "FYB", name: "Faryab", countryCode: "AF", capital: "Maymana" },
    { code: "GHA", name: "Ghazni", countryCode: "AF", capital: "Ghazni" },
    { code: "GHO", name: "Ghor", countryCode: "AF", capital: "Chaghcharan" },
    { code: "HEL", name: "Helmand", countryCode: "AF", capital: "Lashkar Gah" },
    { code: "HER", name: "Herat", countryCode: "AF", capital: "Herat" },
    { code: "JOW", name: "Jowzjan", countryCode: "AF", capital: "Sheberghan" },
    { code: "KAB", name: "Kabul", countryCode: "AF", capital: "Kabul" },
    { code: "KAN", name: "Kandahar", countryCode: "AF", capital: "Kandahar" },
    { code: "KAP", name: "Kapisa", countryCode: "AF", capital: "Mahmud-i-Raqi" },
    { code: "KDZ", name: "Kunduz", countryCode: "AF", capital: "Kunduz" },
    { code: "KHO", name: "Khost", countryCode: "AF", capital: "Khost" },
    { code: "KNR", name: "Kunar", countryCode: "AF", capital: "Asadabad" },
    { code: "LAG", name: "Laghman", countryCode: "AF", capital: "Mihtarlam" },
    { code: "LOG", name: "Logar", countryCode: "AF", capital: "Puli Alam" },
    { code: "NAN", name: "Nangarhar", countryCode: "AF", capital: "Jalalabad" },
    { code: "NIM", name: "Nimroz", countryCode: "AF", capital: "Zaranj" },
    { code: "NUR", name: "Nuristan", countryCode: "AF", capital: "Parun" },
    { code: "PAN", name: "Panjshir", countryCode: "AF", capital: "Bazarak" },
    { code: "PAR", name: "Parwan", countryCode: "AF", capital: "Charikar" },
    { code: "PIA", name: "Paktia", countryCode: "AF", capital: "Gardez" },
    { code: "PKA", name: "Paktika", countryCode: "AF", capital: "Sharan" },
    { code: "SAM", name: "Samangan", countryCode: "AF", capital: "Aybak" },
    { code: "SAR", name: "Sar-e Pol", countryCode: "AF", capital: "Sar-e Pol" },
    { code: "TAK", name: "Takhar", countryCode: "AF", capital: "Taloqan" },
    { code: "URU", name: "Urozgan", countryCode: "AF", capital: "Tarin Kot" },
    { code: "WAR", name: "Wardak", countryCode: "AF", capital: "Maidan Shahr" },
    { code: "ZAB", name: "Zabul", countryCode: "AF", capital: "Qalat" },
  ],
  US: [
    { code: "AL", name: "Alabama", countryCode: "US" },
    { code: "AK", name: "Alaska", countryCode: "US" },
    { code: "AZ", name: "Arizona", countryCode: "US" },
    { code: "AR", name: "Arkansas", countryCode: "US" },
    { code: "CA", name: "California", countryCode: "US" },
    { code: "CO", name: "Colorado", countryCode: "US" },
    { code: "CT", name: "Connecticut", countryCode: "US" },
    { code: "DE", name: "Delaware", countryCode: "US" },
    { code: "FL", name: "Florida", countryCode: "US" },
    { code: "GA", name: "Georgia", countryCode: "US" },
    { code: "HI", name: "Hawaii", countryCode: "US" },
    { code: "ID", name: "Idaho", countryCode: "US" },
    { code: "IL", name: "Illinois", countryCode: "US" },
    { code: "IN", name: "Indiana", countryCode: "US" },
    { code: "IA", name: "Iowa", countryCode: "US" },
    { code: "KS", name: "Kansas", countryCode: "US" },
    { code: "KY", name: "Kentucky", countryCode: "US" },
    { code: "LA", name: "Louisiana", countryCode: "US" },
    { code: "ME", name: "Maine", countryCode: "US" },
    { code: "MD", name: "Maryland", countryCode: "US" },
    { code: "MA", name: "Massachusetts", countryCode: "US" },
    { code: "MI", name: "Michigan", countryCode: "US" },
    { code: "MN", name: "Minnesota", countryCode: "US" },
    { code: "MS", name: "Mississippi", countryCode: "US" },
    { code: "MO", name: "Missouri", countryCode: "US" },
    { code: "MT", name: "Montana", countryCode: "US" },
    { code: "NE", name: "Nebraska", countryCode: "US" },
    { code: "NV", name: "Nevada", countryCode: "US" },
    { code: "NH", name: "New Hampshire", countryCode: "US" },
    { code: "NJ", name: "New Jersey", countryCode: "US" },
    { code: "NM", name: "New Mexico", countryCode: "US" },
    { code: "NY", name: "New York", countryCode: "US" },
    { code: "NC", name: "North Carolina", countryCode: "US" },
    { code: "ND", name: "North Dakota", countryCode: "US" },
    { code: "OH", name: "Ohio", countryCode: "US" },
    { code: "OK", name: "Oklahoma", countryCode: "US" },
    { code: "OR", name: "Oregon", countryCode: "US" },
    { code: "PA", name: "Pennsylvania", countryCode: "US" },
    { code: "RI", name: "Rhode Island", countryCode: "US" },
    { code: "SC", name: "South Carolina", countryCode: "US" },
    { code: "SD", name: "South Dakota", countryCode: "US" },
    { code: "TN", name: "Tennessee", countryCode: "US" },
    { code: "TX", name: "Texas", countryCode: "US" },
    { code: "UT", name: "Utah", countryCode: "US" },
    { code: "VT", name: "Vermont", countryCode: "US" },
    { code: "VA", name: "Virginia", countryCode: "US" },
    { code: "WA", name: "Washington", countryCode: "US" },
    { code: "WV", name: "West Virginia", countryCode: "US" },
    { code: "WI", name: "Wisconsin", countryCode: "US" },
    { code: "WY", name: "Wyoming", countryCode: "US" },
  ],
  CA: [
    { code: "AB", name: "Alberta", countryCode: "CA" },
    { code: "BC", name: "British Columbia", countryCode: "CA" },
    { code: "MB", name: "Manitoba", countryCode: "CA" },
    { code: "NB", name: "New Brunswick", countryCode: "CA" },
    { code: "NL", name: "Newfoundland and Labrador", countryCode: "CA" },
    { code: "NS", name: "Nova Scotia", countryCode: "CA" },
    { code: "ON", name: "Ontario", countryCode: "CA" },
    { code: "PE", name: "Prince Edward Island", countryCode: "CA" },
    { code: "QC", name: "Quebec", countryCode: "CA" },
    { code: "SK", name: "Saskatchewan", countryCode: "CA" },
    { code: "NT", name: "Northwest Territories", countryCode: "CA" },
    { code: "NU", name: "Nunavut", countryCode: "CA" },
    { code: "YT", name: "Yukon", countryCode: "CA" },
  ],
  GB: [
    { code: "ENG", name: "England", countryCode: "GB" },
    { code: "SCT", name: "Scotland", countryCode: "GB" },
    { code: "WLS", name: "Wales", countryCode: "GB" },
    { code: "NIR", name: "Northern Ireland", countryCode: "GB" },
  ],
  IN: [
    { code: "AN", name: "Andaman and Nicobar Islands", countryCode: "IN" },
    { code: "AP", name: "Andhra Pradesh", countryCode: "IN" },
    { code: "AR", name: "Arunachal Pradesh", countryCode: "IN" },
    { code: "AS", name: "Assam", countryCode: "IN" },
    { code: "BR", name: "Bihar", countryCode: "IN" },
    { code: "CH", name: "Chandigarh", countryCode: "IN" },
    { code: "CT", name: "Chhattisgarh", countryCode: "IN" },
    { code: "DL", name: "Delhi", countryCode: "IN" },
    { code: "GA", name: "Goa", countryCode: "IN" },
    { code: "GJ", name: "Gujarat", countryCode: "IN" },
    { code: "HR", name: "Haryana", countryCode: "IN" },
    { code: "HP", name: "Himachal Pradesh", countryCode: "IN" },
    { code: "JK", name: "Jammu and Kashmir", countryCode: "IN" },
    { code: "JH", name: "Jharkhand", countryCode: "IN" },
    { code: "KA", name: "Karnataka", countryCode: "IN" },
    { code: "KL", name: "Kerala", countryCode: "IN" },
    { code: "MP", name: "Madhya Pradesh", countryCode: "IN" },
    { code: "MH", name: "Maharashtra", countryCode: "IN" },
    { code: "MN", name: "Manipur", countryCode: "IN" },
    { code: "ML", name: "Meghalaya", countryCode: "IN" },
    { code: "MZ", name: "Mizoram", countryCode: "IN" },
    { code: "NL", name: "Nagaland", countryCode: "IN" },
    { code: "OR", name: "Odisha", countryCode: "IN" },
    { code: "PY", name: "Puducherry", countryCode: "IN" },
    { code: "PB", name: "Punjab", countryCode: "IN" },
    { code: "RJ", name: "Rajasthan", countryCode: "IN" },
    { code: "SK", name: "Sikkim", countryCode: "IN" },
    { code: "TN", name: "Tamil Nadu", countryCode: "IN" },
    { code: "TG", name: "Telangana", countryCode: "IN" },
    { code: "TR", name: "Tripura", countryCode: "IN" },
    { code: "UP", name: "Uttar Pradesh", countryCode: "IN" },
    { code: "UT", name: "Uttarakhand", countryCode: "IN" },
    { code: "WB", name: "West Bengal", countryCode: "IN" },
  ],
  AU: [
    { code: "NSW", name: "New South Wales", countryCode: "AU" },
    { code: "QLD", name: "Queensland", countryCode: "AU" },
    { code: "SA", name: "South Australia", countryCode: "AU" },
    { code: "TAS", name: "Tasmania", countryCode: "AU" },
    { code: "VIC", name: "Victoria", countryCode: "AU" },
    { code: "WA", name: "Western Australia", countryCode: "AU" },
    { code: "ACT", name: "Australian Capital Territory", countryCode: "AU" },
    { code: "NT", name: "Northern Territory", countryCode: "AU" },
  ],
  DE: [
    { code: "BW", name: "Baden-Württemberg", countryCode: "DE" },
    { code: "BY", name: "Bavaria", countryCode: "DE" },
    { code: "BE", name: "Berlin", countryCode: "DE" },
    { code: "BB", name: "Brandenburg", countryCode: "DE" },
    { code: "HB", name: "Bremen", countryCode: "DE" },
    { code: "HH", name: "Hamburg", countryCode: "DE" },
    { code: "HE", name: "Hesse", countryCode: "DE" },
    { code: "MV", name: "Mecklenburg-Vorpommern", countryCode: "DE" },
    { code: "NI", name: "Lower Saxony", countryCode: "DE" },
    { code: "NW", name: "North Rhine-Westphalia", countryCode: "DE" },
    { code: "RP", name: "Rhineland-Palatinate", countryCode: "DE" },
    { code: "SL", name: "Saarland", countryCode: "DE" },
    { code: "SN", name: "Saxony", countryCode: "DE" },
    { code: "ST", name: "Saxony-Anhalt", countryCode: "DE" },
    { code: "SH", name: "Schleswig-Holstein", countryCode: "DE" },
    { code: "TH", name: "Thuringia", countryCode: "DE" },
  ],
  FR: [
    { code: "ARA", name: "Auvergne-Rhône-Alpes", countryCode: "FR" },
    { code: "BFC", name: "Bourgogne-Franche-Comté", countryCode: "FR" },
    { code: "BRE", name: "Brittany", countryCode: "FR" },
    { code: "CVL", name: "Centre-Val de Loire", countryCode: "FR" },
    { code: "COR", name: "Corsica", countryCode: "FR" },
    { code: "GES", name: "Grand Est", countryCode: "FR" },
    { code: "HDF", name: "Hauts-de-France", countryCode: "FR" },
    { code: "IDF", name: "Île-de-France", countryCode: "FR" },
    { code: "NOR", name: "Normandy", countryCode: "FR" },
    { code: "NAQ", name: "Nouvelle-Aquitaine", countryCode: "FR" },
    { code: "OCC", name: "Occitanie", countryCode: "FR" },
    { code: "PDL", name: "Pays de la Loire", countryCode: "FR" },
    { code: "PAC", name: "Provence-Alpes-Côte d'Azur", countryCode: "FR" },
  ],
  BR: [
    { code: "AC", name: "Acre", countryCode: "BR" },
    { code: "AL", name: "Alagoas", countryCode: "BR" },
    { code: "AP", name: "Amapá", countryCode: "BR" },
    { code: "AM", name: "Amazonas", countryCode: "BR" },
    { code: "BA", name: "Bahia", countryCode: "BR" },
    { code: "CE", name: "Ceará", countryCode: "BR" },
    { code: "DF", name: "Federal District", countryCode: "BR" },
    { code: "ES", name: "Espírito Santo", countryCode: "BR" },
    { code: "GO", name: "Goiás", countryCode: "BR" },
    { code: "MA", name: "Maranhão", countryCode: "BR" },
    { code: "MT", name: "Mato Grosso", countryCode: "BR" },
    { code: "MS", name: "Mato Grosso do Sul", countryCode: "BR" },
    { code: "MG", name: "Minas Gerais", countryCode: "BR" },
    { code: "PA", name: "Pará", countryCode: "BR" },
    { code: "PB", name: "Paraíba", countryCode: "BR" },
    { code: "PR", name: "Paraná", countryCode: "BR" },
    { code: "PE", name: "Pernambuco", countryCode: "BR" },
    { code: "PI", name: "Piauí", countryCode: "BR" },
    { code: "RJ", name: "Rio de Janeiro", countryCode: "BR" },
    { code: "RN", name: "Rio Grande do Norte", countryCode: "BR" },
    { code: "RS", name: "Rio Grande do Sul", countryCode: "BR" },
    { code: "RO", name: "Rondônia", countryCode: "BR" },
    { code: "RR", name: "Roraima", countryCode: "BR" },
    { code: "SC", name: "Santa Catarina", countryCode: "BR" },
    { code: "SP", name: "São Paulo", countryCode: "BR" },
    { code: "SE", name: "Sergipe", countryCode: "BR" },
    { code: "TO", name: "Tocantins", countryCode: "BR" },
  ],
  MX: [
    { code: "AGU", name: "Aguascalientes", countryCode: "MX" },
    { code: "BCN", name: "Baja California", countryCode: "MX" },
    { code: "BCS", name: "Baja California Sur", countryCode: "MX" },
    { code: "CAM", name: "Campeche", countryCode: "MX" },
    { code: "CHP", name: "Chiapas", countryCode: "MX" },
    { code: "CHH", name: "Chihuahua", countryCode: "MX" },
    { code: "COA", name: "Coahuila", countryCode: "MX" },
    { code: "COL", name: "Colima", countryCode: "MX" },
    { code: "DUR", name: "Durango", countryCode: "MX" },
    { code: "GUA", name: "Guanajuato", countryCode: "MX" },
    { code: "GRO", name: "Guerrero", countryCode: "MX" },
    { code: "HID", name: "Hidalgo", countryCode: "MX" },
    { code: "JAL", name: "Jalisco", countryCode: "MX" },
    { code: "MEX", name: "Mexico State", countryCode: "MX" },
    { code: "MIC", name: "Michoacán", countryCode: "MX" },
    { code: "MOR", name: "Morelos", countryCode: "MX" },
    { code: "NAY", name: "Nayarit", countryCode: "MX" },
    { code: "NLE", name: "Nuevo León", countryCode: "MX" },
    { code: "OAX", name: "Oaxaca", countryCode: "MX" },
    { code: "PUE", name: "Puebla", countryCode: "MX" },
    { code: "QUE", name: "Querétaro", countryCode: "MX" },
    { code: "ROO", name: "Quintana Roo", countryCode: "MX" },
    { code: "SLP", name: "San Luis Potosí", countryCode: "MX" },
    { code: "SIN", name: "Sinaloa", countryCode: "MX" },
    { code: "SON", name: "Sonora", countryCode: "MX" },
    { code: "TAB", name: "Tabasco", countryCode: "MX" },
    { code: "TAM", name: "Tamaulipas", countryCode: "MX" },
    { code: "TLA", name: "Tlaxcala", countryCode: "MX" },
    { code: "VER", name: "Veracruz", countryCode: "MX" },
    { code: "YUC", name: "Yucatán", countryCode: "MX" },
    { code: "ZAC", name: "Zacatecas", countryCode: "MX" },
    { code: "CMX", name: "Mexico City", countryCode: "MX" },
  ],
  CN: [
    { code: "AH", name: "Anhui", countryCode: "CN" },
    { code: "BJ", name: "Beijing", countryCode: "CN" },
    { code: "CQ", name: "Chongqing", countryCode: "CN" },
    { code: "FJ", name: "Fujian", countryCode: "CN" },
    { code: "GS", name: "Gansu", countryCode: "CN" },
    { code: "GD", name: "Guangdong", countryCode: "CN" },
    { code: "GX", name: "Guangxi", countryCode: "CN" },
    { code: "GZ", name: "Guizhou", countryCode: "CN" },
    { code: "HI", name: "Hainan", countryCode: "CN" },
    { code: "HE", name: "Hebei", countryCode: "CN" },
    { code: "HL", name: "Heilongjiang", countryCode: "CN" },
    { code: "HA", name: "Henan", countryCode: "CN" },
    { code: "HB", name: "Hubei", countryCode: "CN" },
    { code: "HN", name: "Hunan", countryCode: "CN" },
    { code: "JS", name: "Jiangsu", countryCode: "CN" },
    { code: "JX", name: "Jiangxi", countryCode: "CN" },
    { code: "JL", name: "Jilin", countryCode: "CN" },
    { code: "LN", name: "Liaoning", countryCode: "CN" },
    { code: "NM", name: "Inner Mongolia", countryCode: "CN" },
    { code: "NX", name: "Ningxia", countryCode: "CN" },
    { code: "QH", name: "Qinghai", countryCode: "CN" },
    { code: "SN", name: "Shaanxi", countryCode: "CN" },
    { code: "SD", name: "Shandong", countryCode: "CN" },
    { code: "SH", name: "Shanghai", countryCode: "CN" },
    { code: "SX", name: "Shanxi", countryCode: "CN" },
    { code: "SC", name: "Sichuan", countryCode: "CN" },
    { code: "TJ", name: "Tianjin", countryCode: "CN" },
    { code: "XJ", name: "Xinjiang", countryCode: "CN" },
    { code: "XZ", name: "Tibet", countryCode: "CN" },
    { code: "YN", name: "Yunnan", countryCode: "CN" },
    { code: "ZJ", name: "Zhejiang", countryCode: "CN" },
  ],
  JP: [
    { code: "01", name: "Hokkaido", countryCode: "JP" },
    { code: "02", name: "Aomori", countryCode: "JP" },
    { code: "03", name: "Iwate", countryCode: "JP" },
    { code: "04", name: "Miyagi", countryCode: "JP" },
    { code: "05", name: "Akita", countryCode: "JP" },
    { code: "06", name: "Yamagata", countryCode: "JP" },
    { code: "07", name: "Fukushima", countryCode: "JP" },
    { code: "08", name: "Ibaraki", countryCode: "JP" },
    { code: "09", name: "Tochigi", countryCode: "JP" },
    { code: "10", name: "Gunma", countryCode: "JP" },
    { code: "11", name: "Saitama", countryCode: "JP" },
    { code: "12", name: "Chiba", countryCode: "JP" },
    { code: "13", name: "Tokyo", countryCode: "JP" },
    { code: "14", name: "Kanagawa", countryCode: "JP" },
    { code: "15", name: "Niigata", countryCode: "JP" },
    { code: "16", name: "Toyama", countryCode: "JP" },
    { code: "17", name: "Ishikawa", countryCode: "JP" },
    { code: "18", name: "Fukui", countryCode: "JP" },
    { code: "19", name: "Yamanashi", countryCode: "JP" },
    { code: "20", name: "Nagano", countryCode: "JP" },
    { code: "21", name: "Gifu", countryCode: "JP" },
    { code: "22", name: "Shizuoka", countryCode: "JP" },
    { code: "23", name: "Aichi", countryCode: "JP" },
    { code: "24", name: "Mie", countryCode: "JP" },
    { code: "25", name: "Shiga", countryCode: "JP" },
    { code: "26", name: "Kyoto", countryCode: "JP" },
    { code: "27", name: "Osaka", countryCode: "JP" },
    { code: "28", name: "Hyogo", countryCode: "JP" },
    { code: "29", name: "Nara", countryCode: "JP" },
    { code: "30", name: "Wakayama", countryCode: "JP" },
    { code: "31", name: "Tottori", countryCode: "JP" },
    { code: "32", name: "Shimane", countryCode: "JP" },
    { code: "33", name: "Okayama", countryCode: "JP" },
    { code: "34", name: "Hiroshima", countryCode: "JP" },
    { code: "35", name: "Yamaguchi", countryCode: "JP" },
    { code: "36", name: "Tokushima", countryCode: "JP" },
    { code: "37", name: "Kagawa", countryCode: "JP" },
    { code: "38", name: "Ehime", countryCode: "JP" },
    { code: "39", name: "Kochi", countryCode: "JP" },
    { code: "40", name: "Fukuoka", countryCode: "JP" },
    { code: "41", name: "Saga", countryCode: "JP" },
    { code: "42", name: "Nagasaki", countryCode: "JP" },
    { code: "43", name: "Kumamoto", countryCode: "JP" },
    { code: "44", name: "Oita", countryCode: "JP" },
    { code: "45", name: "Miyazaki", countryCode: "JP" },
    { code: "46", name: "Kagoshima", countryCode: "JP" },
    { code: "47", name: "Okinawa", countryCode: "JP" },
  ],
  IT: [
    { code: "ABR", name: "Abruzzo", countryCode: "IT" },
    { code: "BAS", name: "Basilicata", countryCode: "IT" },
    { code: "CAL", name: "Calabria", countryCode: "IT" },
    { code: "CAM", name: "Campania", countryCode: "IT" },
    { code: "EMR", name: "Emilia-Romagna", countryCode: "IT" },
    { code: "FVG", name: "Friuli-Venezia Giulia", countryCode: "IT" },
    { code: "LAZ", name: "Lazio", countryCode: "IT" },
    { code: "LIG", name: "Liguria", countryCode: "IT" },
    { code: "LOM", name: "Lombardy", countryCode: "IT" },
    { code: "MAR", name: "Marche", countryCode: "IT" },
    { code: "MOL", name: "Molise", countryCode: "IT" },
    { code: "PIE", name: "Piedmont", countryCode: "IT" },
    { code: "PUG", name: "Apulia", countryCode: "IT" },
    { code: "SAR", name: "Sardinia", countryCode: "IT" },
    { code: "SIC", name: "Sicily", countryCode: "IT" },
    { code: "TOS", name: "Tuscany", countryCode: "IT" },
    { code: "TRE", name: "Trentino-South Tyrol", countryCode: "IT" },
    { code: "UMB", name: "Umbria", countryCode: "IT" },
    { code: "VAO", name: "Aosta Valley", countryCode: "IT" },
    { code: "VEN", name: "Veneto", countryCode: "IT" },
  ],
  ES: [
    { code: "AN", name: "Andalusia", countryCode: "ES" },
    { code: "AR", name: "Aragon", countryCode: "ES" },
    { code: "AS", name: "Asturias", countryCode: "ES" },
    { code: "CN", name: "Canary Islands", countryCode: "ES" },
    { code: "CB", name: "Cantabria", countryCode: "ES" },
    { code: "CL", name: "Castile and León", countryCode: "ES" },
    { code: "CM", name: "Castilla-La Mancha", countryCode: "ES" },
    { code: "CT", name: "Catalonia", countryCode: "ES" },
    { code: "EX", name: "Extremadura", countryCode: "ES" },
    { code: "GA", name: "Galicia", countryCode: "ES" },
    { code: "IB", name: "Balearic Islands", countryCode: "ES" },
    { code: "RI", name: "La Rioja", countryCode: "ES" },
    { code: "MD", name: "Madrid", countryCode: "ES" },
    { code: "MC", name: "Murcia", countryCode: "ES" },
    { code: "NC", name: "Navarre", countryCode: "ES" },
    { code: "PV", name: "Basque Country", countryCode: "ES" },
    { code: "VC", name: "Valencia", countryCode: "ES" },
  ],
  NL: [
    { code: "DR", name: "Drenthe", countryCode: "NL" },
    { code: "FL", name: "Flevoland", countryCode: "NL" },
    { code: "FR", name: "Friesland", countryCode: "NL" },
    { code: "GE", name: "Gelderland", countryCode: "NL" },
    { code: "GR", name: "Groningen", countryCode: "NL" },
    { code: "LI", name: "Limburg", countryCode: "NL" },
    { code: "NB", name: "North Brabant", countryCode: "NL" },
    { code: "NH", name: "North Holland", countryCode: "NL" },
    { code: "OV", name: "Overijssel", countryCode: "NL" },
    { code: "UT", name: "Utrecht", countryCode: "NL" },
    { code: "ZE", name: "Zeeland", countryCode: "NL" },
    { code: "ZH", name: "South Holland", countryCode: "NL" },
  ],
  SE: [
    { code: "AB", name: "Stockholm", countryCode: "SE" },
    { code: "C", name: "Uppsala", countryCode: "SE" },
    { code: "D", name: "Södermanland", countryCode: "SE" },
    { code: "E", name: "Östergötland", countryCode: "SE" },
    { code: "F", name: "Jönköping", countryCode: "SE" },
    { code: "G", name: "Kronoberg", countryCode: "SE" },
    { code: "H", name: "Kalmar", countryCode: "SE" },
    { code: "I", name: "Gotland", countryCode: "SE" },
    { code: "K", name: "Blekinge", countryCode: "SE" },
    { code: "M", name: "Skåne", countryCode: "SE" },
    { code: "N", name: "Halland", countryCode: "SE" },
    { code: "O", name: "Västra Götaland", countryCode: "SE" },
    { code: "S", name: "Värmland", countryCode: "SE" },
    { code: "T", name: "Örebro", countryCode: "SE" },
    { code: "U", name: "Västmanland", countryCode: "SE" },
    { code: "W", name: "Dalarna", countryCode: "SE" },
    { code: "X", name: "Gävleborg", countryCode: "SE" },
    { code: "Y", name: "Västernorrland", countryCode: "SE" },
    { code: "Z", name: "Jämtland", countryCode: "SE" },
    { code: "AC", name: "Västerbotten", countryCode: "SE" },
    { code: "BD", name: "Norrbotten", countryCode: "SE" },
  ],
  PL: [
    { code: "DS", name: "Lower Silesian", countryCode: "PL" },
    { code: "KP", name: "Kuyavian-Pomeranian", countryCode: "PL" },
    { code: "LU", name: "Lublin", countryCode: "PL" },
    { code: "LB", name: "Lubusz", countryCode: "PL" },
    { code: "LD", name: "Łódź", countryCode: "PL" },
    { code: "MA", name: "Lesser Poland", countryCode: "PL" },
    { code: "MZ", name: "Masovian", countryCode: "PL" },
    { code: "OP", name: "Opole", countryCode: "PL" },
    { code: "PK", name: "Subcarpathian", countryCode: "PL" },
    { code: "PD", name: "Podlaskie", countryCode: "PL" },
    { code: "PM", name: "Pomeranian", countryCode: "PL" },
    { code: "SL", name: "Silesian", countryCode: "PL" },
    { code: "SK", name: "Świętokrzyskie", countryCode: "PL" },
    { code: "WN", name: "Warmian-Masurian", countryCode: "PL" },
    { code: "WP", name: "Greater Poland", countryCode: "PL" },
    { code: "ZP", name: "West Pomeranian", countryCode: "PL" },
  ],
  AR: [
    { code: "BA", name: "Buenos Aires", countryCode: "AR" },
    { code: "CF", name: "Capital Federal", countryCode: "AR" },
    { code: "CT", name: "Catamarca", countryCode: "AR" },
    { code: "CH", name: "Chaco", countryCode: "AR" },
    { code: "CB", name: "Chubut", countryCode: "AR" },
    { code: "CO", name: "Córdoba", countryCode: "AR" },
    { code: "CR", name: "Corrientes", countryCode: "AR" },
    { code: "ER", name: "Entre Ríos", countryCode: "AR" },
    { code: "FO", name: "Formosa", countryCode: "AR" },
    { code: "JY", name: "Jujuy", countryCode: "AR" },
    { code: "LP", name: "La Pampa", countryCode: "AR" },
    { code: "LR", name: "La Rioja", countryCode: "AR" },
    { code: "MZ", name: "Mendoza", countryCode: "AR" },
    { code: "MI", name: "Misiones", countryCode: "AR" },
    { code: "NQ", name: "Neuquén", countryCode: "AR" },
    { code: "RN", name: "Río Negro", countryCode: "AR" },
    { code: "SA", name: "Salta", countryCode: "AR" },
    { code: "SJ", name: "San Juan", countryCode: "AR" },
    { code: "SL", name: "San Luis", countryCode: "AR" },
    { code: "SC", name: "Santa Cruz", countryCode: "AR" },
    { code: "SF", name: "Santa Fe", countryCode: "AR" },
    { code: "SE", name: "Santiago del Estero", countryCode: "AR" },
    { code: "TF", name: "Tierra del Fuego", countryCode: "AR" },
    { code: "TM", name: "Tucumán", countryCode: "AR" },
  ],
  AT: [
    { code: "1", name: "Burgenland", countryCode: "AT" },
    { code: "2", name: "Carinthia", countryCode: "AT" },
    { code: "3", name: "Lower Austria", countryCode: "AT" },
    { code: "4", name: "Upper Austria", countryCode: "AT" },
    { code: "5", name: "Salzburg", countryCode: "AT" },
    { code: "6", name: "Styria", countryCode: "AT" },
    { code: "7", name: "Tyrol", countryCode: "AT" },
    { code: "8", name: "Vorarlberg", countryCode: "AT" },
    { code: "9", name: "Vienna", countryCode: "AT" },
  ],
  BE: [
    { code: "BRU", name: "Brussels", countryCode: "BE" },
    { code: "VLG", name: "Flanders", countryCode: "BE" },
    { code: "WAL", name: "Wallonia", countryCode: "BE" },
  ],
  CH: [
    { code: "AG", name: "Aargau", countryCode: "CH" },
    { code: "AR", name: "Appenzell Ausserrhoden", countryCode: "CH" },
    { code: "AI", name: "Appenzell Innerrhoden", countryCode: "CH" },
    { code: "BL", name: "Basel-Landschaft", countryCode: "CH" },
    { code: "BS", name: "Basel-Stadt", countryCode: "CH" },
    { code: "BE", name: "Bern", countryCode: "CH" },
    { code: "FR", name: "Fribourg", countryCode: "CH" },
    { code: "GE", name: "Geneva", countryCode: "CH" },
    { code: "GL", name: "Glarus", countryCode: "CH" },
    { code: "GR", name: "Graubünden", countryCode: "CH" },
    { code: "JU", name: "Jura", countryCode: "CH" },
    { code: "LU", name: "Lucerne", countryCode: "CH" },
    { code: "NE", name: "Neuchâtel", countryCode: "CH" },
    { code: "NW", name: "Nidwalden", countryCode: "CH" },
    { code: "OW", name: "Obwalden", countryCode: "CH" },
    { code: "SG", name: "St. Gallen", countryCode: "CH" },
    { code: "SH", name: "Schaffhausen", countryCode: "CH" },
    { code: "SZ", name: "Schwyz", countryCode: "CH" },
    { code: "SO", name: "Solothurn", countryCode: "CH" },
    { code: "TG", name: "Thurgau", countryCode: "CH" },
    { code: "TI", name: "Ticino", countryCode: "CH" },
    { code: "UR", name: "Uri", countryCode: "CH" },
    { code: "VD", name: "Vaud", countryCode: "CH" },
    { code: "VS", name: "Valais", countryCode: "CH" },
    { code: "ZG", name: "Zug", countryCode: "CH" },
    { code: "ZH", name: "Zurich", countryCode: "CH" },
  ],
  CZ: [
    { code: "JC", name: "South Bohemian", countryCode: "CZ" },
    { code: "JM", name: "South Moravian", countryCode: "CZ" },
    { code: "KA", name: "Karlovy Vary", countryCode: "CZ" },
    { code: "KR", name: "Hradec Králové", countryCode: "CZ" },
    { code: "LI", name: "Liberec", countryCode: "CZ" },
    { code: "MO", name: "Moravian-Silesian", countryCode: "CZ" },
    { code: "OL", name: "Olomouc", countryCode: "CZ" },
    { code: "PA", name: "Pardubice", countryCode: "CZ" },
    { code: "PL", name: "Plzeň", countryCode: "CZ" },
    { code: "PR", name: "Prague", countryCode: "CZ" },
    { code: "ST", name: "Central Bohemian", countryCode: "CZ" },
    { code: "US", name: "Ústí nad Labem", countryCode: "CZ" },
    { code: "VY", name: "Vysočina", countryCode: "CZ" },
    { code: "ZL", name: "Zlín", countryCode: "CZ" },
  ],
  DK: [
    { code: "84", name: "Capital Region", countryCode: "DK" },
    { code: "82", name: "Central Denmark", countryCode: "DK" },
    { code: "81", name: "North Denmark", countryCode: "DK" },
    { code: "85", name: "Zealand", countryCode: "DK" },
    { code: "83", name: "Southern Denmark", countryCode: "DK" },
  ],
  FI: [
    { code: "01", name: "Åland Islands", countryCode: "FI" },
    { code: "02", name: "South Karelia", countryCode: "FI" },
    { code: "03", name: "Southern Ostrobothnia", countryCode: "FI" },
    { code: "04", name: "Southern Savonia", countryCode: "FI" },
    { code: "05", name: "Kainuu", countryCode: "FI" },
    { code: "06", name: "Tavastia Proper", countryCode: "FI" },
    { code: "07", name: "Central Ostrobothnia", countryCode: "FI" },
    { code: "08", name: "Central Finland", countryCode: "FI" },
    { code: "09", name: "Kymenlaakso", countryCode: "FI" },
    { code: "10", name: "Lapland", countryCode: "FI" },
    { code: "11", name: "Pirkanmaa", countryCode: "FI" },
    { code: "12", name: "Ostrobothnia", countryCode: "FI" },
    { code: "13", name: "North Karelia", countryCode: "FI" },
    { code: "14", name: "Northern Ostrobothnia", countryCode: "FI" },
    { code: "15", name: "Northern Savonia", countryCode: "FI" },
    { code: "16", name: "Päijänne Tavastia", countryCode: "FI" },
    { code: "17", name: "Satakunta", countryCode: "FI" },
    { code: "18", name: "Uusimaa", countryCode: "FI" },
    { code: "19", name: "Southwest Finland", countryCode: "FI" },
  ],
  GR: [
    { code: "A", name: "Eastern Macedonia and Thrace", countryCode: "GR" },
    { code: "B", name: "Central Macedonia", countryCode: "GR" },
    { code: "C", name: "Western Macedonia", countryCode: "GR" },
    { code: "D", name: "Epirus", countryCode: "GR" },
    { code: "E", name: "Thessaly", countryCode: "GR" },
    { code: "F", name: "Ionian Islands", countryCode: "GR" },
    { code: "G", name: "Western Greece", countryCode: "GR" },
    { code: "H", name: "Central Greece", countryCode: "GR" },
    { code: "I", name: "Attica", countryCode: "GR" },
    { code: "J", name: "Peloponnese", countryCode: "GR" },
    { code: "K", name: "North Aegean", countryCode: "GR" },
    { code: "L", name: "South Aegean", countryCode: "GR" },
    { code: "M", name: "Crete", countryCode: "GR" },
  ],
  IE: [
    { code: "C", name: "Connacht", countryCode: "IE" },
    { code: "L", name: "Leinster", countryCode: "IE" },
    { code: "M", name: "Munster", countryCode: "IE" },
    { code: "U", name: "Ulster", countryCode: "IE" },
  ],
  NO: [
    { code: "03", name: "Oslo", countryCode: "NO" },
    { code: "11", name: "Rogaland", countryCode: "NO" },
    { code: "15", name: "Møre og Romsdal", countryCode: "NO" },
    { code: "18", name: "Nordland", countryCode: "NO" },
    { code: "30", name: "Viken", countryCode: "NO" },
    { code: "34", name: "Innlandet", countryCode: "NO" },
    { code: "38", name: "Vestfold og Telemark", countryCode: "NO" },
    { code: "42", name: "Agder", countryCode: "NO" },
    { code: "46", name: "Vestland", countryCode: "NO" },
    { code: "50", name: "Trøndelag", countryCode: "NO" },
    { code: "54", name: "Troms og Finnmark", countryCode: "NO" },
  ],
  NZ: [
    { code: "AUK", name: "Auckland", countryCode: "NZ" },
    { code: "BOP", name: "Bay of Plenty", countryCode: "NZ" },
    { code: "CAN", name: "Canterbury", countryCode: "NZ" },
    { code: "GIS", name: "Gisborne", countryCode: "NZ" },
    { code: "HKB", name: "Hawke's Bay", countryCode: "NZ" },
    { code: "MWT", name: "Manawatu-Wanganui", countryCode: "NZ" },
    { code: "MBH", name: "Marlborough", countryCode: "NZ" },
    { code: "NSN", name: "Nelson", countryCode: "NZ" },
    { code: "NTL", name: "Northland", countryCode: "NZ" },
    { code: "OTA", name: "Otago", countryCode: "NZ" },
    { code: "STL", name: "Southland", countryCode: "NZ" },
    { code: "TKI", name: "Taranaki", countryCode: "NZ" },
    { code: "TAS", name: "Tasman", countryCode: "NZ" },
    { code: "WKO", name: "Waikato", countryCode: "NZ" },
    { code: "WGN", name: "Wellington", countryCode: "NZ" },
    { code: "WTC", name: "West Coast", countryCode: "NZ" },
  ],
  PT: [
    { code: "01", name: "Aveiro", countryCode: "PT" },
    { code: "02", name: "Beja", countryCode: "PT" },
    { code: "03", name: "Braga", countryCode: "PT" },
    { code: "04", name: "Bragança", countryCode: "PT" },
    { code: "05", name: "Castelo Branco", countryCode: "PT" },
    { code: "06", name: "Coimbra", countryCode: "PT" },
    { code: "07", name: "Évora", countryCode: "PT" },
    { code: "08", name: "Faro", countryCode: "PT" },
    { code: "09", name: "Guarda", countryCode: "PT" },
    { code: "10", name: "Leiria", countryCode: "PT" },
    { code: "11", name: "Lisbon", countryCode: "PT" },
    { code: "12", name: "Portalegre", countryCode: "PT" },
    { code: "13", name: "Porto", countryCode: "PT" },
    { code: "14", name: "Santarém", countryCode: "PT" },
    { code: "15", name: "Setúbal", countryCode: "PT" },
    { code: "16", name: "Viana do Castelo", countryCode: "PT" },
    { code: "17", name: "Vila Real", countryCode: "PT" },
    { code: "18", name: "Viseu", countryCode: "PT" },
    { code: "20", name: "Azores", countryCode: "PT" },
    { code: "30", name: "Madeira", countryCode: "PT" },
  ],
  RO: [
    { code: "AB", name: "Alba", countryCode: "RO" },
    { code: "AR", name: "Arad", countryCode: "RO" },
    { code: "AG", name: "Argeș", countryCode: "RO" },
    { code: "BC", name: "Bacău", countryCode: "RO" },
    { code: "BH", name: "Bihor", countryCode: "RO" },
    { code: "BN", name: "Bistrița-Năsăud", countryCode: "RO" },
    { code: "BT", name: "Botoșani", countryCode: "RO" },
    { code: "BR", name: "Brăila", countryCode: "RO" },
    { code: "BV", name: "Brașov", countryCode: "RO" },
    { code: "B", name: "Bucharest", countryCode: "RO" },
    { code: "BZ", name: "Buzău", countryCode: "RO" },
    { code: "CL", name: "Călărași", countryCode: "RO" },
    { code: "CS", name: "Caraș-Severin", countryCode: "RO" },
    { code: "CJ", name: "Cluj", countryCode: "RO" },
    { code: "CT", name: "Constanța", countryCode: "RO" },
    { code: "CV", name: "Covasna", countryCode: "RO" },
    { code: "DB", name: "Dâmbovița", countryCode: "RO" },
    { code: "DJ", name: "Dolj", countryCode: "RO" },
    { code: "GL", name: "Galați", countryCode: "RO" },
    { code: "GR", name: "Giurgiu", countryCode: "RO" },
    { code: "GJ", name: "Gorj", countryCode: "RO" },
    { code: "HR", name: "Harghita", countryCode: "RO" },
    { code: "HD", name: "Hunedoara", countryCode: "RO" },
    { code: "IL", name: "Ialomița", countryCode: "RO" },
    { code: "IS", name: "Iași", countryCode: "RO" },
    { code: "IF", name: "Ilfov", countryCode: "RO" },
    { code: "MM", name: "Maramureș", countryCode: "RO" },
    { code: "MH", name: "Mehedinți", countryCode: "RO" },
    { code: "MS", name: "Mureș", countryCode: "RO" },
    { code: "NT", name: "Neamț", countryCode: "RO" },
    { code: "OT", name: "Olt", countryCode: "RO" },
    { code: "PH", name: "Prahova", countryCode: "RO" },
    { code: "SJ", name: "Sălaj", countryCode: "RO" },
    { code: "SM", name: "Satu Mare", countryCode: "RO" },
    { code: "SB", name: "Sibiu", countryCode: "RO" },
    { code: "SV", name: "Suceava", countryCode: "RO" },
    { code: "TR", name: "Teleorman", countryCode: "RO" },
    { code: "TM", name: "Timiș", countryCode: "RO" },
    { code: "TL", name: "Tulcea", countryCode: "RO" },
    { code: "VL", name: "Vâlcea", countryCode: "RO" },
    { code: "VS", name: "Vaslui", countryCode: "RO" },
    { code: "VN", name: "Vrancea", countryCode: "RO" },
  ],
  ZA: [
    { code: "EC", name: "Eastern Cape", countryCode: "ZA" },
    { code: "FS", name: "Free State", countryCode: "ZA" },
    { code: "GP", name: "Gauteng", countryCode: "ZA" },
    { code: "KZN", name: "KwaZulu-Natal", countryCode: "ZA" },
    { code: "LP", name: "Limpopo", countryCode: "ZA" },
    { code: "MP", name: "Mpumalanga", countryCode: "ZA" },
    { code: "NC", name: "Northern Cape", countryCode: "ZA" },
    { code: "NW", name: "North West", countryCode: "ZA" },
    { code: "WC", name: "Western Cape", countryCode: "ZA" },
  ],
  // Gulf Countries
  AE: [
    { code: "AZ", name: "Abu Dhabi", countryCode: "AE" },
    { code: "AJ", name: "Ajman", countryCode: "AE" },
    { code: "DU", name: "Dubai", countryCode: "AE" },
    { code: "FU", name: "Fujairah", countryCode: "AE" },
    { code: "RK", name: "Ras Al Khaimah", countryCode: "AE" },
    { code: "SH", name: "Sharjah", countryCode: "AE" },
    { code: "UQ", name: "Umm Al Quwain", countryCode: "AE" },
  ],
  SA: [
    { code: "01", name: "Riyadh", countryCode: "SA" },
    { code: "02", name: "Makkah", countryCode: "SA" },
    { code: "03", name: "Madinah", countryCode: "SA" },
    { code: "04", name: "Eastern Province", countryCode: "SA" },
    { code: "05", name: "Asir", countryCode: "SA" },
    { code: "06", name: "Tabuk", countryCode: "SA" },
    { code: "07", name: "Qassim", countryCode: "SA" },
    { code: "08", name: "Ha'il", countryCode: "SA" },
    { code: "09", name: "Northern Borders", countryCode: "SA" },
    { code: "10", name: "Jizan", countryCode: "SA" },
    { code: "11", name: "Najran", countryCode: "SA" },
    { code: "12", name: "Al Bahah", countryCode: "SA" },
    { code: "14", name: "Al Jawf", countryCode: "SA" },
  ],
  BH: [
    { code: "13", name: "Capital Governorate", countryCode: "BH" },
    { code: "14", name: "Muharraq Governorate", countryCode: "BH" },
    { code: "15", name: "Northern Governorate", countryCode: "BH" },
    { code: "17", name: "Southern Governorate", countryCode: "BH" },
  ],
  KW: [
    { code: "AH", name: "Ahmadi", countryCode: "KW" },
    { code: "FA", name: "Farwaniya", countryCode: "KW" },
    { code: "HA", name: "Hawalli", countryCode: "KW" },
    { code: "JA", name: "Jahra", countryCode: "KW" },
    { code: "KU", name: "Kuwait City", countryCode: "KW" },
    { code: "MU", name: "Mubarak Al-Kabeer", countryCode: "KW" },
  ],
  OM: [
    { code: "DA", name: "Ad Dakhiliyah", countryCode: "OM" },
    { code: "BU", name: "Al Buraimi", countryCode: "OM" },
    { code: "WU", name: "Al Wusta", countryCode: "OM" },
    { code: "ZA", name: "Az Zahirah", countryCode: "OM" },
    { code: "BJ", name: "Janub al Batinah", countryCode: "OM" },
    { code: "SJ", name: "Janub ash Sharqiyah", countryCode: "OM" },
    { code: "MA", name: "Masqat", countryCode: "OM" },
    { code: "MU", name: "Musandam", countryCode: "OM" },
    { code: "BS", name: "Shamal al Batinah", countryCode: "OM" },
    { code: "SS", name: "Shamal ash Sharqiyah", countryCode: "OM" },
    { code: "ZU", name: "Zufar", countryCode: "OM" },
  ],
  QA: [
    { code: "DA", name: "Ad Dawhah", countryCode: "QA" },
    { code: "KH", name: "Al Khor", countryCode: "QA" },
    { code: "WA", name: "Al Wakrah", countryCode: "QA" },
    { code: "RA", name: "Ar Rayyan", countryCode: "QA" },
    { code: "MS", name: "Ash Shamal", countryCode: "QA" },
    { code: "ZA", name: "Az Za'ayin", countryCode: "QA" },
    { code: "US", name: "Umm Salal", countryCode: "QA" },
  ],
  // Middle East Countries
  IQ: [
    { code: "AN", name: "Al Anbar", countryCode: "IQ" },
    { code: "BA", name: "Basra", countryCode: "IQ" },
    { code: "MU", name: "Al Muthanna", countryCode: "IQ" },
    { code: "QA", name: "Al Qadisiyyah", countryCode: "IQ" },
    { code: "NA", name: "Najaf", countryCode: "IQ" },
    { code: "AR", name: "Arbil", countryCode: "IQ" },
    { code: "SU", name: "As Sulaymaniyah", countryCode: "IQ" },
    { code: "BG", name: "Baghdad", countryCode: "IQ" },
    { code: "BB", name: "Babil", countryCode: "IQ" },
    { code: "DA", name: "Dohuk", countryCode: "IQ" },
    { code: "DQ", name: "Dhi Qar", countryCode: "IQ" },
    { code: "DI", name: "Diyala", countryCode: "IQ" },
    { code: "KA", name: "Karbala", countryCode: "IQ" },
    { code: "KI", name: "Kirkuk", countryCode: "IQ" },
    { code: "MA", name: "Maysan", countryCode: "IQ" },
    { code: "NI", name: "Ninawa", countryCode: "IQ" },
    { code: "SD", name: "Salah ad Din", countryCode: "IQ" },
    { code: "WA", name: "Wasit", countryCode: "IQ" },
  ],
  JO: [
    { code: "AJ", name: "Ajloun", countryCode: "JO" },
    { code: "AM", name: "Amman", countryCode: "JO" },
    { code: "AQ", name: "Aqaba", countryCode: "JO" },
    { code: "BA", name: "Balqa", countryCode: "JO" },
    { code: "IR", name: "Irbid", countryCode: "JO" },
    { code: "JA", name: "Jarash", countryCode: "JO" },
    { code: "KA", name: "Karak", countryCode: "JO" },
    { code: "MA", name: "Ma'an", countryCode: "JO" },
    { code: "MD", name: "Madaba", countryCode: "JO" },
    { code: "MN", name: "Mafraq", countryCode: "JO" },
    { code: "TA", name: "Tafilah", countryCode: "JO" },
    { code: "ZA", name: "Zarqa", countryCode: "JO" },
  ],
  LB: [
    { code: "AK", name: "Akkar", countryCode: "LB" },
    { code: "BH", name: "Baalbek-Hermel", countryCode: "LB" },
    { code: "BI", name: "Beirut", countryCode: "LB" },
    { code: "BA", name: "Beqaa", countryCode: "LB" },
    { code: "AS", name: "Mount Lebanon", countryCode: "LB" },
    { code: "NA", name: "Nabatieh", countryCode: "LB" },
    { code: "JA", name: "North", countryCode: "LB" },
    { code: "JL", name: "South", countryCode: "LB" },
  ],
  SY: [
    { code: "LA", name: "Latakia", countryCode: "SY" },
    { code: "TA", name: "Tartus", countryCode: "SY" },
    { code: "HL", name: "Aleppo", countryCode: "SY" },
    { code: "ID", name: "Idlib", countryCode: "SY" },
    { code: "HM", name: "Hama", countryCode: "SY" },
    { code: "HI", name: "Homs", countryCode: "SY" },
    { code: "DI", name: "Damascus", countryCode: "SY" },
    { code: "RD", name: "Rif Dimashq", countryCode: "SY" },
    { code: "QU", name: "Quneitra", countryCode: "SY" },
    { code: "DR", name: "Daraa", countryCode: "SY" },
    { code: "SU", name: "As-Suwayda", countryCode: "SY" },
    { code: "RA", name: "Ar-Raqqah", countryCode: "SY" },
    { code: "DY", name: "Deir ez-Zor", countryCode: "SY" },
    { code: "HA", name: "Al-Hasakah", countryCode: "SY" },
  ],
  YE: [
    { code: "SA", name: "Sana'a", countryCode: "YE" },
    { code: "AD", name: "Aden", countryCode: "YE" },
    { code: "TA", name: "Taiz", countryCode: "YE" },
    { code: "HD", name: "Hadramaut", countryCode: "YE" },
    { code: "IB", name: "Ibb", countryCode: "YE" },
    { code: "HJ", name: "Hajjah", countryCode: "YE" },
    { code: "HU", name: "Al Hudaydah", countryCode: "YE" },
    { code: "DH", name: "Dhamar", countryCode: "YE" },
    { code: "AM", name: "Amran", countryCode: "YE" },
    { code: "BA", name: "Al Bayda", countryCode: "YE" },
    { code: "JA", name: "Al Jawf", countryCode: "YE" },
    { code: "MA", name: "Ma'rib", countryCode: "YE" },
    { code: "MR", name: "Al Mahrah", countryCode: "YE" },
    { code: "MW", name: "Al Mahwit", countryCode: "YE" },
    { code: "SD", name: "Saada", countryCode: "YE" },
    { code: "SN", name: "Sana'a Governorate", countryCode: "YE" },
    { code: "SH", name: "Shabwah", countryCode: "YE" },
    { code: "AB", name: "Abyan", countryCode: "YE" },
    { code: "LA", name: "Lahij", countryCode: "YE" },
    { code: "DA", name: "Ad Dali", countryCode: "YE" },
    { code: "RA", name: "Raymah", countryCode: "YE" },
  ],
  IL: [
    { code: "D", name: "Southern District", countryCode: "IL" },
    { code: "HA", name: "Haifa District", countryCode: "IL" },
    { code: "JM", name: "Jerusalem District", countryCode: "IL" },
    { code: "M", name: "Central District", countryCode: "IL" },
    { code: "TA", name: "Tel Aviv District", countryCode: "IL" },
    { code: "Z", name: "Northern District", countryCode: "IL" },
  ],
  TR: [
    { code: "01", name: "Adana", countryCode: "TR" },
    { code: "02", name: "Adıyaman", countryCode: "TR" },
    { code: "03", name: "Afyonkarahisar", countryCode: "TR" },
    { code: "04", name: "Ağrı", countryCode: "TR" },
    { code: "05", name: "Amasya", countryCode: "TR" },
    { code: "06", name: "Ankara", countryCode: "TR" },
    { code: "07", name: "Antalya", countryCode: "TR" },
    { code: "08", name: "Artvin", countryCode: "TR" },
    { code: "09", name: "Aydın", countryCode: "TR" },
    { code: "10", name: "Balıkesir", countryCode: "TR" },
    { code: "11", name: "Bilecik", countryCode: "TR" },
    { code: "12", name: "Bingöl", countryCode: "TR" },
    { code: "13", name: "Bitlis", countryCode: "TR" },
    { code: "14", name: "Bolu", countryCode: "TR" },
    { code: "15", name: "Burdur", countryCode: "TR" },
    { code: "16", name: "Bursa", countryCode: "TR" },
    { code: "17", name: "Çanakkale", countryCode: "TR" },
    { code: "18", name: "Çankırı", countryCode: "TR" },
    { code: "19", name: "Çorum", countryCode: "TR" },
    { code: "20", name: "Denizli", countryCode: "TR" },
    { code: "21", name: "Diyarbakır", countryCode: "TR" },
    { code: "22", name: "Edirne", countryCode: "TR" },
    { code: "23", name: "Elazığ", countryCode: "TR" },
    { code: "24", name: "Erzincan", countryCode: "TR" },
    { code: "25", name: "Erzurum", countryCode: "TR" },
    { code: "26", name: "Eskişehir", countryCode: "TR" },
    { code: "27", name: "Gaziantep", countryCode: "TR" },
    { code: "28", name: "Giresun", countryCode: "TR" },
    { code: "29", name: "Gümüşhane", countryCode: "TR" },
    { code: "30", name: "Hakkâri", countryCode: "TR" },
    { code: "31", name: "Hatay", countryCode: "TR" },
    { code: "32", name: "Isparta", countryCode: "TR" },
    { code: "33", name: "Mersin", countryCode: "TR" },
    { code: "34", name: "Istanbul", countryCode: "TR" },
    { code: "35", name: "İzmir", countryCode: "TR" },
    { code: "36", name: "Kars", countryCode: "TR" },
    { code: "37", name: "Kastamonu", countryCode: "TR" },
    { code: "38", name: "Kayseri", countryCode: "TR" },
    { code: "39", name: "Kırklareli", countryCode: "TR" },
    { code: "40", name: "Kırşehir", countryCode: "TR" },
    { code: "41", name: "Kocaeli", countryCode: "TR" },
    { code: "42", name: "Konya", countryCode: "TR" },
    { code: "43", name: "Kütahya", countryCode: "TR" },
    { code: "44", name: "Malatya", countryCode: "TR" },
    { code: "45", name: "Manisa", countryCode: "TR" },
    { code: "46", name: "Kahramanmaraş", countryCode: "TR" },
    { code: "47", name: "Mardin", countryCode: "TR" },
    { code: "48", name: "Muğla", countryCode: "TR" },
    { code: "49", name: "Muş", countryCode: "TR" },
    { code: "50", name: "Nevşehir", countryCode: "TR" },
    { code: "51", name: "Niğde", countryCode: "TR" },
    { code: "52", name: "Ordu", countryCode: "TR" },
    { code: "53", name: "Rize", countryCode: "TR" },
    { code: "54", name: "Sakarya", countryCode: "TR" },
    { code: "55", name: "Samsun", countryCode: "TR" },
    { code: "56", name: "Siirt", countryCode: "TR" },
    { code: "57", name: "Sinop", countryCode: "TR" },
    { code: "58", name: "Sivas", countryCode: "TR" },
    { code: "59", name: "Tekirdağ", countryCode: "TR" },
    { code: "60", name: "Tokat", countryCode: "TR" },
    { code: "61", name: "Trabzon", countryCode: "TR" },
    { code: "62", name: "Tunceli", countryCode: "TR" },
    { code: "63", name: "Şanlıurfa", countryCode: "TR" },
    { code: "64", name: "Uşak", countryCode: "TR" },
    { code: "65", name: "Van", countryCode: "TR" },
    { code: "66", name: "Yozgat", countryCode: "TR" },
    { code: "67", name: "Zonguldak", countryCode: "TR" },
    { code: "68", name: "Aksaray", countryCode: "TR" },
    { code: "69", name: "Bayburt", countryCode: "TR" },
    { code: "70", name: "Karaman", countryCode: "TR" },
    { code: "71", name: "Kırıkkale", countryCode: "TR" },
    { code: "72", name: "Batman", countryCode: "TR" },
    { code: "73", name: "Şırnak", countryCode: "TR" },
    { code: "74", name: "Bartın", countryCode: "TR" },
    { code: "75", name: "Ardahan", countryCode: "TR" },
    { code: "76", name: "Iğdır", countryCode: "TR" },
    { code: "77", name: "Yalova", countryCode: "TR" },
    { code: "78", name: "Karabük", countryCode: "TR" },
    { code: "79", name: "Kilis", countryCode: "TR" },
    { code: "80", name: "Osmaniye", countryCode: "TR" },
    { code: "81", name: "Düzce", countryCode: "TR" },
  ],
  IR: [
    { code: "01", name: "Tehran", countryCode: "IR" },
    { code: "02", name: "Qom", countryCode: "IR" },
    { code: "03", name: "Markazi", countryCode: "IR" },
    { code: "04", name: "Qazvin", countryCode: "IR" },
    { code: "05", name: "Gilan", countryCode: "IR" },
    { code: "06", name: "Ardabil", countryCode: "IR" },
    { code: "07", name: "Zanjan", countryCode: "IR" },
    { code: "08", name: "East Azerbaijan", countryCode: "IR" },
    { code: "09", name: "West Azerbaijan", countryCode: "IR" },
    { code: "10", name: "Kurdistan", countryCode: "IR" },
    { code: "11", name: "Hamadan", countryCode: "IR" },
    { code: "12", name: "Kermanshah", countryCode: "IR" },
    { code: "13", name: "Ilam", countryCode: "IR" },
    { code: "14", name: "Lorestan", countryCode: "IR" },
    { code: "15", name: "Khuzestan", countryCode: "IR" },
    { code: "16", name: "Chaharmahal and Bakhtiari", countryCode: "IR" },
    { code: "17", name: "Kohgiluyeh and Boyer-Ahmad", countryCode: "IR" },
    { code: "18", name: "Bushehr", countryCode: "IR" },
    { code: "19", name: "Fars", countryCode: "IR" },
    { code: "20", name: "Hormozgan", countryCode: "IR" },
    { code: "21", name: "Sistan and Baluchestan", countryCode: "IR" },
    { code: "22", name: "Kerman", countryCode: "IR" },
    { code: "23", name: "Yazd", countryCode: "IR" },
    { code: "24", name: "Isfahan", countryCode: "IR" },
    { code: "25", name: "Semnan", countryCode: "IR" },
    { code: "26", name: "Mazandaran", countryCode: "IR" },
    { code: "27", name: "Golestan", countryCode: "IR" },
    { code: "28", name: "North Khorasan", countryCode: "IR" },
    { code: "29", name: "Razavi Khorasan", countryCode: "IR" },
    { code: "30", name: "South Khorasan", countryCode: "IR" },
    { code: "31", name: "Alborz", countryCode: "IR" },
  ],
};

// Sample cities data (this would ideally come from an API)
export const citiesData: Record<string, City[]> = {
  // Afghanistan Cities
  "AF-KAB": [
    { name: "Kabul", stateCode: "KAB", countryCode: "AF", population: 4635000, isCapital: true },
  ],
  "AF-HER": [
    { name: "Herat", stateCode: "HER", countryCode: "AF", population: 574300, isCapital: true },
  ],
  "AF-KAN": [
    { name: "Kandahar", stateCode: "KAN", countryCode: "AF", population: 614118, isCapital: true },
  ],
  "AF-BAL": [
    { name: "Mazar-i-Sharif", stateCode: "BAL", countryCode: "AF", population: 500207, isCapital: true },
  ],
  "AF-NAN": [
    { name: "Jalalabad", stateCode: "NAN", countryCode: "AF", population: 356274, isCapital: true },
  ],
  "AF-KDZ": [
    { name: "Kunduz", stateCode: "KDZ", countryCode: "AF", population: 374000, isCapital: true },
  ],
  "AF-GHA": [
    { name: "Ghazni", stateCode: "GHA", countryCode: "AF", population: 270000, isCapital: true },
  ],
  "AF-BAM": [
    { name: "Bamyan", stateCode: "BAM", countryCode: "AF", population: 100000, isCapital: true },
  ],
  "AF-HEL": [
    { name: "Lashkar Gah", stateCode: "HEL", countryCode: "AF", population: 201546, isCapital: true },
  ],
  "AF-KHO": [
    { name: "Khost", stateCode: "KHO", countryCode: "AF", population: 160214, isCapital: true },
  ],
  "AF-FYB": [
    { name: "Maymana", stateCode: "FYB", countryCode: "AF", population: 149040, isCapital: true },
  ],
  "AF-TAK": [
    { name: "Taloqan", stateCode: "TAK", countryCode: "AF", population: 196400, isCapital: true },
  ],
  "AF-BGL": [
    { name: "Puli Khumri", stateCode: "BGL", countryCode: "AF", population: 221274, isCapital: true },
  ],
  "AF-FRA": [
    { name: "Farah", stateCode: "FRA", countryCode: "AF", population: 109409, isCapital: true },
  ],
  "AF-JOW": [
    { name: "Sheberghan", stateCode: "JOW", countryCode: "AF", population: 175599, isCapital: true },
  ],
  "AF-PIA": [
    { name: "Gardez", stateCode: "PIA", countryCode: "AF", population: 103601, isCapital: true },
  ],
  "AF-BDS": [
    { name: "Fayzabad", stateCode: "BDS", countryCode: "AF", population: 77189, isCapital: true },
  ],
  "AF-KNR": [
    { name: "Asadabad", stateCode: "KNR", countryCode: "AF", population: 48400, isCapital: true },
  ],
  "AF-PAR": [
    { name: "Charikar", stateCode: "PAR", countryCode: "AF", population: 67727, isCapital: true },
  ],
  "AF-BDG": [
    { name: "Qala-e-Naw", stateCode: "BDG", countryCode: "AF", population: 31007, isCapital: true },
  ],
  
  // US Cities
  "US-CA": [
    { name: "Los Angeles", stateCode: "CA", countryCode: "US", population: 3898747 },
    { name: "San Francisco", stateCode: "CA", countryCode: "US", population: 873965 },
    { name: "San Diego", stateCode: "CA", countryCode: "US", population: 1386932 },
    { name: "San Jose", stateCode: "CA", countryCode: "US", population: 1013240 },
    { name: "Sacramento", stateCode: "CA", countryCode: "US", population: 508529, isCapital: true },
    { name: "Fresno", stateCode: "CA", countryCode: "US", population: 542107 },
    { name: "Long Beach", stateCode: "CA", countryCode: "US", population: 462257 },
    { name: "Oakland", stateCode: "CA", countryCode: "US", population: 433031 },
    { name: "Bakersfield", stateCode: "CA", countryCode: "US", population: 403455 },
    { name: "Anaheim", stateCode: "CA", countryCode: "US", population: 352497 },
    { name: "Santa Ana", stateCode: "CA", countryCode: "US", population: 310227 },
    { name: "Riverside", stateCode: "CA", countryCode: "US", population: 331360 },
    { name: "Stockton", stateCode: "CA", countryCode: "US", population: 312697 },
    { name: "Irvine", stateCode: "CA", countryCode: "US", population: 307670 },
  ],
  "US-NY": [
    { name: "New York City", stateCode: "NY", countryCode: "US", population: 8336817 },
    { name: "Buffalo", stateCode: "NY", countryCode: "US", population: 278349 },
    { name: "Rochester", stateCode: "NY", countryCode: "US", population: 211328 },
    { name: "Albany", stateCode: "NY", countryCode: "US", population: 99224, isCapital: true },
    { name: "Syracuse", stateCode: "NY", countryCode: "US", population: 142749 },
    { name: "Yonkers", stateCode: "NY", countryCode: "US", population: 211569 },
  ],
  "US-TX": [
    { name: "Houston", stateCode: "TX", countryCode: "US", population: 2320268 },
    { name: "Dallas", stateCode: "TX", countryCode: "US", population: 1343573 },
    { name: "Austin", stateCode: "TX", countryCode: "US", population: 978908, isCapital: true },
    { name: "San Antonio", stateCode: "TX", countryCode: "US", population: 1547253 },
    { name: "Fort Worth", stateCode: "TX", countryCode: "US", population: 918915 },
    { name: "El Paso", stateCode: "TX", countryCode: "US", population: 681728 },
    { name: "Arlington", stateCode: "TX", countryCode: "US", population: 398854 },
    { name: "Corpus Christi", stateCode: "TX", countryCode: "US", population: 326586 },
    { name: "Plano", stateCode: "TX", countryCode: "US", population: 288061 },
  ],
  "US-FL": [
    { name: "Miami", stateCode: "FL", countryCode: "US", population: 470914 },
    { name: "Orlando", stateCode: "FL", countryCode: "US", population: 307573 },
    { name: "Tampa", stateCode: "FL", countryCode: "US", population: 399700 },
    { name: "Jacksonville", stateCode: "FL", countryCode: "US", population: 949611 },
    { name: "Tallahassee", stateCode: "FL", countryCode: "US", population: 196169, isCapital: true },
    { name: "Fort Lauderdale", stateCode: "FL", countryCode: "US", population: 182760 },
    { name: "St. Petersburg", stateCode: "FL", countryCode: "US", population: 265098 },
  ],
  "US-IL": [
    { name: "Chicago", stateCode: "IL", countryCode: "US", population: 2746388 },
    { name: "Aurora", stateCode: "IL", countryCode: "US", population: 180542 },
    { name: "Naperville", stateCode: "IL", countryCode: "US", population: 149104 },
    { name: "Springfield", stateCode: "IL", countryCode: "US", population: 116250, isCapital: true },
  ],
  "US-PA": [
    { name: "Philadelphia", stateCode: "PA", countryCode: "US", population: 1584064 },
    { name: "Pittsburgh", stateCode: "PA", countryCode: "US", population: 302971 },
    { name: "Harrisburg", stateCode: "PA", countryCode: "US", population: 50135, isCapital: true },
  ],
  "US-OH": [
    { name: "Columbus", stateCode: "OH", countryCode: "US", population: 898553, isCapital: true },
    { name: "Cleveland", stateCode: "OH", countryCode: "US", population: 372624 },
    { name: "Cincinnati", stateCode: "OH", countryCode: "US", population: 309317 },
  ],
  "US-GA": [
    { name: "Atlanta", stateCode: "GA", countryCode: "US", population: 498715, isCapital: true },
    { name: "Augusta", stateCode: "GA", countryCode: "US", population: 202081 },
    { name: "Savannah", stateCode: "GA", countryCode: "US", population: 147780 },
  ],
  "US-MI": [
    { name: "Detroit", stateCode: "MI", countryCode: "US", population: 639111 },
    { name: "Grand Rapids", stateCode: "MI", countryCode: "US", population: 198893 },
    { name: "Lansing", stateCode: "MI", countryCode: "US", population: 118427, isCapital: true },
  ],
  "US-MA": [
    { name: "Boston", stateCode: "MA", countryCode: "US", population: 692600, isCapital: true },
    { name: "Worcester", stateCode: "MA", countryCode: "US", population: 206518 },
  ],
  "US-WA": [
    { name: "Seattle", stateCode: "WA", countryCode: "US", population: 753675 },
    { name: "Spokane", stateCode: "WA", countryCode: "US", population: 222081 },
    { name: "Olympia", stateCode: "WA", countryCode: "US", population: 55605, isCapital: true },
  ],
  "US-AZ": [
    { name: "Phoenix", stateCode: "AZ", countryCode: "US", population: 1680992, isCapital: true },
    { name: "Tucson", stateCode: "AZ", countryCode: "US", population: 548073 },
    { name: "Mesa", stateCode: "AZ", countryCode: "US", population: 508958 },
  ],
  "US-NV": [
    { name: "Las Vegas", stateCode: "NV", countryCode: "US", population: 641903 },
    { name: "Henderson", stateCode: "NV", countryCode: "US", population: 320189 },
    { name: "Carson City", stateCode: "NV", countryCode: "US", population: 58639, isCapital: true },
  ],
  "US-CO": [
    { name: "Denver", stateCode: "CO", countryCode: "US", population: 727211, isCapital: true },
    { name: "Colorado Springs", stateCode: "CO", countryCode: "US", population: 478221 },
    { name: "Aurora", stateCode: "CO", countryCode: "US", population: 386261 },
  ],
  "CA-ON": [
    { name: "Toronto", stateCode: "ON", countryCode: "CA" },
    { name: "Ottawa", stateCode: "ON", countryCode: "CA" },
    { name: "Mississauga", stateCode: "ON", countryCode: "CA" },
  ],
  "CA-BC": [
    { name: "Vancouver", stateCode: "BC", countryCode: "CA" },
    { name: "Victoria", stateCode: "BC", countryCode: "CA" },
  ],
  "GB-ENG": [
    { name: "London", stateCode: "ENG", countryCode: "GB" },
    { name: "Manchester", stateCode: "ENG", countryCode: "GB" },
    { name: "Birmingham", stateCode: "ENG", countryCode: "GB" },
    { name: "Liverpool", stateCode: "ENG", countryCode: "GB" },
  ],
  "IN-MH": [
    { name: "Mumbai", stateCode: "MH", countryCode: "IN", population: 20411000, isCapital: true },
    { name: "Pune", stateCode: "MH", countryCode: "IN", population: 6430000 },
    { name: "Nagpur", stateCode: "MH", countryCode: "IN", population: 2405000 },
    { name: "Thane", stateCode: "MH", countryCode: "IN", population: 1886000 },
    { name: "Nashik", stateCode: "MH", countryCode: "IN", population: 1486000 },
    { name: "Aurangabad", stateCode: "MH", countryCode: "IN", population: 1175000 },
    { name: "Solapur", stateCode: "MH", countryCode: "IN", population: 951000 },
    { name: "Amravati", stateCode: "MH", countryCode: "IN", population: 647000 },
    { name: "Kolhapur", stateCode: "MH", countryCode: "IN", population: 561000 },
  ],
  "IN-DL": [
    { name: "New Delhi", stateCode: "DL", countryCode: "IN", population: 32900000, isCapital: true },
  ],
  "IN-KA": [
    { name: "Bangalore", stateCode: "KA", countryCode: "IN", population: 13600000, isCapital: true },
    { name: "Mysore", stateCode: "KA", countryCode: "IN", population: 1060000 },
    { name: "Hubli", stateCode: "KA", countryCode: "IN", population: 943000 },
    { name: "Mangalore", stateCode: "KA", countryCode: "IN", population: 623000 },
    { name: "Belgaum", stateCode: "KA", countryCode: "IN", population: 610000 },
    { name: "Gulbarga", stateCode: "KA", countryCode: "IN", population: 543000 },
  ],
  "IN-TG": [
    { name: "Hyderabad", stateCode: "TG", countryCode: "IN", population: 10500000, isCapital: true },
    { name: "Warangal", stateCode: "TG", countryCode: "IN", population: 811000 },
    { name: "Nizamabad", stateCode: "TG", countryCode: "IN", population: 311000 },
    { name: "Khammam", stateCode: "TG", countryCode: "IN", population: 262000 },
    { name: "Karimnagar", stateCode: "TG", countryCode: "IN", population: 297000 },
    { name: "Ramagundam", stateCode: "TG", countryCode: "IN", population: 242000 },
  ],
  "IN-TN": [
    { name: "Chennai", stateCode: "TN", countryCode: "IN", population: 11000000, isCapital: true },
    { name: "Coimbatore", stateCode: "TN", countryCode: "IN", population: 2151000 },
    { name: "Madurai", stateCode: "TN", countryCode: "IN", population: 1561000 },
    { name: "Tiruchirappalli", stateCode: "TN", countryCode: "IN", population: 1021000 },
    { name: "Salem", stateCode: "TN", countryCode: "IN", population: 918000 },
    { name: "Tirunelveli", stateCode: "TN", countryCode: "IN", population: 498000 },
  ],
  "IN-UP": [
    { name: "Lucknow", stateCode: "UP", countryCode: "IN", population: 3382000, isCapital: true },
    { name: "Kanpur", stateCode: "UP", countryCode: "IN", population: 3200000 },
    { name: "Agra", stateCode: "UP", countryCode: "IN", population: 1746000 },
    { name: "Varanasi", stateCode: "UP", countryCode: "IN", population: 1435000 },
    { name: "Noida", stateCode: "UP", countryCode: "IN", population: 642381 },
    { name: "Ghaziabad", stateCode: "UP", countryCode: "IN", population: 2381000 },
    { name: "Meerut", stateCode: "UP", countryCode: "IN", population: 1763000 },
    { name: "Allahabad", stateCode: "UP", countryCode: "IN", population: 1216000 },
  ],
  "IN-GJ": [
    { name: "Ahmedabad", stateCode: "GJ", countryCode: "IN", population: 8450000 },
    { name: "Surat", stateCode: "GJ", countryCode: "IN", population: 6081000 },
    { name: "Vadodara", stateCode: "GJ", countryCode: "IN", population: 2065000 },
    { name: "Rajkot", stateCode: "GJ", countryCode: "IN", population: 1390000 },
    { name: "Gandhinagar", stateCode: "GJ", countryCode: "IN", population: 292000, isCapital: true },
    { name: "Bhavnagar", stateCode: "GJ", countryCode: "IN", population: 605000 },
  ],
  "IN-RJ": [
    { name: "Jaipur", stateCode: "RJ", countryCode: "IN", population: 3900000, isCapital: true },
    { name: "Jodhpur", stateCode: "RJ", countryCode: "IN", population: 1137000 },
    { name: "Udaipur", stateCode: "RJ", countryCode: "IN", population: 474000 },
    { name: "Kota", stateCode: "RJ", countryCode: "IN", population: 1001000 },
    { name: "Ajmer", stateCode: "RJ", countryCode: "IN", population: 551000 },
  ],
  "IN-WB": [
    { name: "Kolkata", stateCode: "WB", countryCode: "IN", population: 15000000, isCapital: true },
    { name: "Howrah", stateCode: "WB", countryCode: "IN", population: 1077000 },
    { name: "Durgapur", stateCode: "WB", countryCode: "IN", population: 581000 },
    { name: "Siliguri", stateCode: "WB", countryCode: "IN", population: 513000 },
  ],
  "IN-AP": [
    { name: "Visakhapatnam", stateCode: "AP", countryCode: "IN", population: 2035000 },
    { name: "Vijayawada", stateCode: "AP", countryCode: "IN", population: 1048000 },
    { name: "Guntur", stateCode: "AP", countryCode: "IN", population: 743000 },
    { name: "Amaravati", stateCode: "AP", countryCode: "IN", population: 123000, isCapital: true },
  ],
  "IN-HR": [
    { name: "Gurugram", stateCode: "HR", countryCode: "IN", population: 1153000 },
    { name: "Faridabad", stateCode: "HR", countryCode: "IN", population: 1404000 },
    { name: "Panipat", stateCode: "HR", countryCode: "IN", population: 356000 },
    { name: "Chandigarh", stateCode: "HR", countryCode: "IN", population: 1055000, isCapital: true },
  ],
  "IN-PB": [
    { name: "Chandigarh", stateCode: "PB", countryCode: "IN", population: 1055000, isCapital: true },
    { name: "Ludhiana", stateCode: "PB", countryCode: "IN", population: 1618000 },
    { name: "Amritsar", stateCode: "PB", countryCode: "IN", population: 1183000 },
    { name: "Jalandhar", stateCode: "PB", countryCode: "IN", population: 873000 },
    { name: "Patiala", stateCode: "PB", countryCode: "IN", population: 406000 },
  ],
  "IN-KL": [
    { name: "Thiruvananthapuram", stateCode: "KL", countryCode: "IN", population: 1680000, isCapital: true },
    { name: "Kochi", stateCode: "KL", countryCode: "IN", population: 2119000 },
    { name: "Kozhikode", stateCode: "KL", countryCode: "IN", population: 2030000 },
    { name: "Thrissur", stateCode: "KL", countryCode: "IN", population: 1854000 },
  ],
  "IN-BR": [
    { name: "Patna", stateCode: "BR", countryCode: "IN", population: 2046000, isCapital: true },
    { name: "Gaya", stateCode: "BR", countryCode: "IN", population: 470000 },
    { name: "Bhagalpur", stateCode: "BR", countryCode: "IN", population: 410000 },
  ],
  "IN-MP": [
    { name: "Bhopal", stateCode: "MP", countryCode: "IN", population: 1883000, isCapital: true },
    { name: "Indore", stateCode: "MP", countryCode: "IN", population: 2201000 },
    { name: "Gwalior", stateCode: "MP", countryCode: "IN", population: 1101000 },
    { name: "Jabalpur", stateCode: "MP", countryCode: "IN", population: 1268000 },
  ],
  "IN-OR": [
    { name: "Bhubaneswar", stateCode: "OR", countryCode: "IN", population: 885000, isCapital: true },
    { name: "Cuttack", stateCode: "OR", countryCode: "IN", population: 663000 },
  ],
  "IN-JH": [
    { name: "Ranchi", stateCode: "JH", countryCode: "IN", population: 1126000, isCapital: true },
    { name: "Jamshedpur", stateCode: "JH", countryCode: "IN", population: 1337000 },
    { name: "Dhanbad", stateCode: "JH", countryCode: "IN", population: 1195000 },
  ],
  "IN-CT": [
    { name: "Raipur", stateCode: "CT", countryCode: "IN", population: 1123000, isCapital: true },
    { name: "Bhilai", stateCode: "CT", countryCode: "IN", population: 1064000 },
  ],
  "IN-AS": [
    { name: "Guwahati", stateCode: "AS", countryCode: "IN", population: 1116000 },
    { name: "Dispur", stateCode: "AS", countryCode: "IN", population: 25000, isCapital: true },
  ],
  "AU-NSW": [
    { name: "Sydney", stateCode: "NSW", countryCode: "AU" },
    { name: "Newcastle", stateCode: "NSW", countryCode: "AU" },
  ],
  "AU-VIC": [
    { name: "Melbourne", stateCode: "VIC", countryCode: "AU" },
  ],
  "AU-QLD": [
    { name: "Brisbane", stateCode: "QLD", countryCode: "AU" },
    { name: "Gold Coast", stateCode: "QLD", countryCode: "AU" },
  ],
  
  // Germany Cities
  "DE-BE": [
    { name: "Berlin", stateCode: "BE", countryCode: "DE" },
  ],
  "DE-BY": [
    { name: "Munich", stateCode: "BY", countryCode: "DE" },
    { name: "Nuremberg", stateCode: "BY", countryCode: "DE" },
  ],
  "DE-HH": [
    { name: "Hamburg", stateCode: "HH", countryCode: "DE" },
  ],
  "DE-NW": [
    { name: "Cologne", stateCode: "NW", countryCode: "DE" },
    { name: "Dusseldorf", stateCode: "NW", countryCode: "DE" },
    { name: "Dortmund", stateCode: "NW", countryCode: "DE" },
  ],
  "DE-HE": [
    { name: "Frankfurt", stateCode: "HE", countryCode: "DE" },
  ],
  
  // France Cities
  "FR-IDF": [
    { name: "Paris", stateCode: "IDF", countryCode: "FR" },
    { name: "Versailles", stateCode: "IDF", countryCode: "FR" },
  ],
  "FR-ARA": [
    { name: "Lyon", stateCode: "ARA", countryCode: "FR" },
    { name: "Grenoble", stateCode: "ARA", countryCode: "FR" },
  ],
  "FR-PAC": [
    { name: "Marseille", stateCode: "PAC", countryCode: "FR" },
    { name: "Nice", stateCode: "PAC", countryCode: "FR" },
  ],
  
  // Brazil Cities
  "BR-SP": [
    { name: "São Paulo", stateCode: "SP", countryCode: "BR" },
    { name: "Campinas", stateCode: "SP", countryCode: "BR" },
  ],
  "BR-RJ": [
    { name: "Rio de Janeiro", stateCode: "RJ", countryCode: "BR" },
    { name: "Niterói", stateCode: "RJ", countryCode: "BR" },
  ],
  "BR-MG": [
    { name: "Belo Horizonte", stateCode: "MG", countryCode: "BR" },
  ],
  "BR-BA": [
    { name: "Salvador", stateCode: "BA", countryCode: "BR" },
  ],
  "BR-DF": [
    { name: "Brasília", stateCode: "DF", countryCode: "BR" },
  ],
  
  // Mexico Cities
  "MX-CMX": [
    { name: "Mexico City", stateCode: "CMX", countryCode: "MX" },
  ],
  "MX-JAL": [
    { name: "Guadalajara", stateCode: "JAL", countryCode: "MX" },
  ],
  "MX-NLE": [
    { name: "Monterrey", stateCode: "NLE", countryCode: "MX" },
  ],
  "MX-PUE": [
    { name: "Puebla", stateCode: "PUE", countryCode: "MX" },
  ],
  
  // China Cities
  "CN-BJ": [
    { name: "Beijing", stateCode: "BJ", countryCode: "CN" },
  ],
  "CN-SH": [
    { name: "Shanghai", stateCode: "SH", countryCode: "CN" },
  ],
  "CN-GD": [
    { name: "Guangzhou", stateCode: "GD", countryCode: "CN" },
    { name: "Shenzhen", stateCode: "GD", countryCode: "CN" },
  ],
  "CN-ZJ": [
    { name: "Hangzhou", stateCode: "ZJ", countryCode: "CN" },
  ],
  "CN-SC": [
    { name: "Chengdu", stateCode: "SC", countryCode: "CN" },
  ],
  
  // Japan Cities
  "JP-13": [
    { name: "Tokyo", stateCode: "13", countryCode: "JP" },
  ],
  "JP-27": [
    { name: "Osaka", stateCode: "27", countryCode: "JP" },
  ],
  "JP-26": [
    { name: "Kyoto", stateCode: "26", countryCode: "JP" },
  ],
  "JP-14": [
    { name: "Yokohama", stateCode: "14", countryCode: "JP" },
  ],
  "JP-01": [
    { name: "Sapporo", stateCode: "01", countryCode: "JP" },
  ],
  
  // Italy Cities
  "IT-LAZ": [
    { name: "Rome", stateCode: "LAZ", countryCode: "IT" },
  ],
  "IT-LOM": [
    { name: "Milan", stateCode: "LOM", countryCode: "IT" },
  ],
  "IT-CAM": [
    { name: "Naples", stateCode: "CAM", countryCode: "IT" },
  ],
  "IT-TOS": [
    { name: "Florence", stateCode: "TOS", countryCode: "IT" },
  ],
  "IT-VEN": [
    { name: "Venice", stateCode: "VEN", countryCode: "IT" },
  ],
  
  // Spain Cities
  "ES-MD": [
    { name: "Madrid", stateCode: "MD", countryCode: "ES" },
  ],
  "ES-CT": [
    { name: "Barcelona", stateCode: "CT", countryCode: "ES" },
  ],
  "ES-AN": [
    { name: "Seville", stateCode: "AN", countryCode: "ES" },
    { name: "Malaga", stateCode: "AN", countryCode: "ES" },
  ],
  "ES-VC": [
    { name: "Valencia", stateCode: "VC", countryCode: "ES" },
  ],
  
  // Netherlands Cities
  "NL-NH": [
    { name: "Amsterdam", stateCode: "NH", countryCode: "NL" },
  ],
  "NL-ZH": [
    { name: "Rotterdam", stateCode: "ZH", countryCode: "NL" },
    { name: "The Hague", stateCode: "ZH", countryCode: "NL" },
  ],
  "NL-UT": [
    { name: "Utrecht", stateCode: "UT", countryCode: "NL" },
  ],
  
  // Sweden Cities
  "SE-AB": [
    { name: "Stockholm", stateCode: "AB", countryCode: "SE" },
  ],
  "SE-O": [
    { name: "Gothenburg", stateCode: "O", countryCode: "SE" },
  ],
  "SE-M": [
    { name: "Malmö", stateCode: "M", countryCode: "SE" },
  ],
  
  // Poland Cities
  "PL-MZ": [
    { name: "Warsaw", stateCode: "MZ", countryCode: "PL" },
  ],
  "PL-MA": [
    { name: "Krakow", stateCode: "MA", countryCode: "PL" },
  ],
  "PL-DS": [
    { name: "Wroclaw", stateCode: "DS", countryCode: "PL" },
  ],
  
  // Argentina Cities
  "AR-CF": [
    { name: "Buenos Aires", stateCode: "CF", countryCode: "AR" },
  ],
  "AR-CO": [
    { name: "Córdoba", stateCode: "CO", countryCode: "AR" },
  ],
  "AR-SF": [
    { name: "Rosario", stateCode: "SF", countryCode: "AR" },
  ],
  
  // Austria Cities
  "AT-9": [
    { name: "Vienna", stateCode: "9", countryCode: "AT" },
  ],
  "AT-5": [
    { name: "Salzburg", stateCode: "5", countryCode: "AT" },
  ],
  "AT-6": [
    { name: "Graz", stateCode: "6", countryCode: "AT" },
  ],
  "AT-7": [
    { name: "Innsbruck", stateCode: "7", countryCode: "AT" },
  ],
  
  // Belgium Cities
  "BE-BRU": [
    { name: "Brussels", stateCode: "BRU", countryCode: "BE" },
  ],
  "BE-VLG": [
    { name: "Antwerp", stateCode: "VLG", countryCode: "BE" },
    { name: "Ghent", stateCode: "VLG", countryCode: "BE" },
    { name: "Bruges", stateCode: "VLG", countryCode: "BE" },
  ],
  "BE-WAL": [
    { name: "Liège", stateCode: "WAL", countryCode: "BE" },
    { name: "Charleroi", stateCode: "WAL", countryCode: "BE" },
  ],
  
  // Switzerland Cities
  "CH-ZH": [
    { name: "Zurich", stateCode: "ZH", countryCode: "CH" },
  ],
  "CH-GE": [
    { name: "Geneva", stateCode: "GE", countryCode: "CH" },
  ],
  "CH-BE": [
    { name: "Bern", stateCode: "BE", countryCode: "CH" },
  ],
  "CH-BS": [
    { name: "Basel", stateCode: "BS", countryCode: "CH" },
  ],
  "CH-VD": [
    { name: "Lausanne", stateCode: "VD", countryCode: "CH" },
  ],
  
  // Czech Republic Cities
  "CZ-PR": [
    { name: "Prague", stateCode: "PR", countryCode: "CZ" },
  ],
  "CZ-JM": [
    { name: "Brno", stateCode: "JM", countryCode: "CZ" },
  ],
  "CZ-PL": [
    { name: "Plzeň", stateCode: "PL", countryCode: "CZ" },
  ],
  
  // Denmark Cities
  "DK-84": [
    { name: "Copenhagen", stateCode: "84", countryCode: "DK" },
  ],
  "DK-82": [
    { name: "Aarhus", stateCode: "82", countryCode: "DK" },
  ],
  "DK-83": [
    { name: "Odense", stateCode: "83", countryCode: "DK" },
  ],
  
  // Finland Cities
  "FI-18": [
    { name: "Helsinki", stateCode: "18", countryCode: "FI" },
    { name: "Espoo", stateCode: "18", countryCode: "FI" },
  ],
  "FI-11": [
    { name: "Tampere", stateCode: "11", countryCode: "FI" },
  ],
  "FI-19": [
    { name: "Turku", stateCode: "19", countryCode: "FI" },
  ],
  
  // Greece Cities
  "GR-I": [
    { name: "Athens", stateCode: "I", countryCode: "GR" },
  ],
  "GR-B": [
    { name: "Thessaloniki", stateCode: "B", countryCode: "GR" },
  ],
  "GR-M": [
    { name: "Heraklion", stateCode: "M", countryCode: "GR" },
  ],
  
  // Ireland Cities
  "IE-L": [
    { name: "Dublin", stateCode: "L", countryCode: "IE" },
  ],
  "IE-M": [
    { name: "Cork", stateCode: "M", countryCode: "IE" },
  ],
  "IE-C": [
    { name: "Galway", stateCode: "C", countryCode: "IE" },
  ],
  
  // Norway Cities
  "NO-03": [
    { name: "Oslo", stateCode: "03", countryCode: "NO" },
  ],
  "NO-46": [
    { name: "Bergen", stateCode: "46", countryCode: "NO" },
  ],
  "NO-50": [
    { name: "Trondheim", stateCode: "50", countryCode: "NO" },
  ],
  
  // New Zealand Cities
  "NZ-AUK": [
    { name: "Auckland", stateCode: "AUK", countryCode: "NZ" },
  ],
  "NZ-WGN": [
    { name: "Wellington", stateCode: "WGN", countryCode: "NZ" },
  ],
  "NZ-CAN": [
    { name: "Christchurch", stateCode: "CAN", countryCode: "NZ" },
  ],
  
  // Portugal Cities
  "PT-11": [
    { name: "Lisbon", stateCode: "11", countryCode: "PT" },
  ],
  "PT-13": [
    { name: "Porto", stateCode: "13", countryCode: "PT" },
  ],
  "PT-08": [
    { name: "Faro", stateCode: "08", countryCode: "PT" },
  ],
  
  // Romania Cities
  "RO-B": [
    { name: "Bucharest", stateCode: "B", countryCode: "RO" },
  ],
  "RO-CJ": [
    { name: "Cluj-Napoca", stateCode: "CJ", countryCode: "RO" },
  ],
  "RO-TM": [
    { name: "Timișoara", stateCode: "TM", countryCode: "RO" },
  ],
  
  // South Africa Cities
  "ZA-GP": [
    { name: "Johannesburg", stateCode: "GP", countryCode: "ZA" },
    { name: "Pretoria", stateCode: "GP", countryCode: "ZA" },
  ],
  "ZA-WC": [
    { name: "Cape Town", stateCode: "WC", countryCode: "ZA" },
  ],
  "ZA-KZN": [
    { name: "Durban", stateCode: "KZN", countryCode: "ZA" },
  ],
  
  // United Arab Emirates Cities
  "AE-AZ": [
    { name: "Abu Dhabi", stateCode: "AZ", countryCode: "AE" },
    { name: "Al Ain", stateCode: "AZ", countryCode: "AE" },
  ],
  "AE-DU": [
    { name: "Dubai", stateCode: "DU", countryCode: "AE" },
  ],
  "AE-SH": [
    { name: "Sharjah", stateCode: "SH", countryCode: "AE" },
  ],
  "AE-AJ": [
    { name: "Ajman", stateCode: "AJ", countryCode: "AE" },
  ],
  "AE-RK": [
    { name: "Ras Al Khaimah", stateCode: "RK", countryCode: "AE" },
  ],
  "AE-FU": [
    { name: "Fujairah", stateCode: "FU", countryCode: "AE" },
  ],
  "AE-UQ": [
    { name: "Umm Al Quwain", stateCode: "UQ", countryCode: "AE" },
  ],
  
  // Saudi Arabia Cities
  "SA-01": [
    { name: "Riyadh", stateCode: "01", countryCode: "SA" },
  ],
  "SA-02": [
    { name: "Mecca", stateCode: "02", countryCode: "SA" },
    { name: "Jeddah", stateCode: "02", countryCode: "SA" },
    { name: "Taif", stateCode: "02", countryCode: "SA" },
  ],
  "SA-03": [
    { name: "Medina", stateCode: "03", countryCode: "SA" },
    { name: "Yanbu", stateCode: "03", countryCode: "SA" },
  ],
  "SA-04": [
    { name: "Dammam", stateCode: "04", countryCode: "SA" },
    { name: "Khobar", stateCode: "04", countryCode: "SA" },
    { name: "Dhahran", stateCode: "04", countryCode: "SA" },
    { name: "Jubail", stateCode: "04", countryCode: "SA" },
  ],
  "SA-05": [
    { name: "Abha", stateCode: "05", countryCode: "SA" },
    { name: "Khamis Mushait", stateCode: "05", countryCode: "SA" },
  ],
  "SA-06": [
    { name: "Tabuk", stateCode: "06", countryCode: "SA" },
  ],
  "SA-07": [
    { name: "Buraidah", stateCode: "07", countryCode: "SA" },
    { name: "Unaizah", stateCode: "07", countryCode: "SA" },
  ],
  
  // Bahrain Cities
  "BH-13": [
    { name: "Manama", stateCode: "13", countryCode: "BH" },
  ],
  "BH-14": [
    { name: "Muharraq", stateCode: "14", countryCode: "BH" },
  ],
  "BH-17": [
    { name: "Riffa", stateCode: "17", countryCode: "BH" },
  ],
  
  // Kuwait Cities
  "KW-KU": [
    { name: "Kuwait City", stateCode: "KU", countryCode: "KW" },
  ],
  "KW-HA": [
    { name: "Hawalli", stateCode: "HA", countryCode: "KW" },
    { name: "Salmiya", stateCode: "HA", countryCode: "KW" },
  ],
  "KW-AH": [
    { name: "Ahmadi", stateCode: "AH", countryCode: "KW" },
  ],
  "KW-FA": [
    { name: "Farwaniya", stateCode: "FA", countryCode: "KW" },
  ],
  
  // Oman Cities
  "OM-MA": [
    { name: "Muscat", stateCode: "MA", countryCode: "OM" },
  ],
  "OM-ZU": [
    { name: "Salalah", stateCode: "ZU", countryCode: "OM" },
  ],
  "OM-BS": [
    { name: "Sohar", stateCode: "BS", countryCode: "OM" },
  ],
  "OM-DA": [
    { name: "Nizwa", stateCode: "DA", countryCode: "OM" },
  ],
  
  // Qatar Cities
  "QA-DA": [
    { name: "Doha", stateCode: "DA", countryCode: "QA" },
  ],
  "QA-RA": [
    { name: "Al Rayyan", stateCode: "RA", countryCode: "QA" },
  ],
  "QA-WA": [
    { name: "Al Wakrah", stateCode: "WA", countryCode: "QA" },
  ],
  "QA-KH": [
    { name: "Al Khor", stateCode: "KH", countryCode: "QA" },
  ],
  
  // Iraq Cities
  "IQ-BG": [
    { name: "Baghdad", stateCode: "BG", countryCode: "IQ" },
  ],
  "IQ-BA": [
    { name: "Basra", stateCode: "BA", countryCode: "IQ" },
  ],
  "IQ-NI": [
    { name: "Mosul", stateCode: "NI", countryCode: "IQ" },
  ],
  "IQ-AR": [
    { name: "Erbil", stateCode: "AR", countryCode: "IQ" },
  ],
  "IQ-SU": [
    { name: "Sulaymaniyah", stateCode: "SU", countryCode: "IQ" },
  ],
  "IQ-KI": [
    { name: "Kirkuk", stateCode: "KI", countryCode: "IQ" },
  ],
  "IQ-NA": [
    { name: "Najaf", stateCode: "NA", countryCode: "IQ" },
  ],
  "IQ-KA": [
    { name: "Karbala", stateCode: "KA", countryCode: "IQ" },
  ],
  
  // Jordan Cities
  "JO-AM": [
    { name: "Amman", stateCode: "AM", countryCode: "JO" },
  ],
  "JO-AQ": [
    { name: "Aqaba", stateCode: "AQ", countryCode: "JO" },
  ],
  "JO-IR": [
    { name: "Irbid", stateCode: "IR", countryCode: "JO" },
  ],
  "JO-ZA": [
    { name: "Zarqa", stateCode: "ZA", countryCode: "JO" },
  ],
  
  // Lebanon Cities
  "LB-BI": [
    { name: "Beirut", stateCode: "BI", countryCode: "LB" },
  ],
  "LB-JA": [
    { name: "Tripoli", stateCode: "JA", countryCode: "LB" },
  ],
  "LB-JL": [
    { name: "Sidon", stateCode: "JL", countryCode: "LB" },
    { name: "Tyre", stateCode: "JL", countryCode: "LB" },
  ],
  "LB-BH": [
    { name: "Baalbek", stateCode: "BH", countryCode: "LB" },
  ],
  
  // Syria Cities
  "SY-DI": [
    { name: "Damascus", stateCode: "DI", countryCode: "SY" },
  ],
  "SY-HL": [
    { name: "Aleppo", stateCode: "HL", countryCode: "SY" },
  ],
  "SY-HI": [
    { name: "Homs", stateCode: "HI", countryCode: "SY" },
  ],
  "SY-HM": [
    { name: "Hama", stateCode: "HM", countryCode: "SY" },
  ],
  "SY-LA": [
    { name: "Latakia", stateCode: "LA", countryCode: "SY" },
  ],
  
  // Yemen Cities
  "YE-SA": [
    { name: "Sana'a", stateCode: "SA", countryCode: "YE" },
  ],
  "YE-AD": [
    { name: "Aden", stateCode: "AD", countryCode: "YE" },
  ],
  "YE-TA": [
    { name: "Taiz", stateCode: "TA", countryCode: "YE" },
  ],
  "YE-HD": [
    { name: "Mukalla", stateCode: "HD", countryCode: "YE" },
  ],
  
  // Israel Cities
  "IL-TA": [
    { name: "Tel Aviv", stateCode: "TA", countryCode: "IL" },
  ],
  "IL-JM": [
    { name: "Jerusalem", stateCode: "JM", countryCode: "IL" },
  ],
  "IL-HA": [
    { name: "Haifa", stateCode: "HA", countryCode: "IL" },
  ],
  "IL-D": [
    { name: "Beersheba", stateCode: "D", countryCode: "IL" },
  ],
  
  // Turkey Cities
  "TR-34": [
    { name: "Istanbul", stateCode: "34", countryCode: "TR" },
  ],
  "TR-06": [
    { name: "Ankara", stateCode: "06", countryCode: "TR" },
  ],
  "TR-35": [
    { name: "Izmir", stateCode: "35", countryCode: "TR" },
  ],
  "TR-16": [
    { name: "Bursa", stateCode: "16", countryCode: "TR" },
  ],
  "TR-07": [
    { name: "Antalya", stateCode: "07", countryCode: "TR" },
  ],
  "TR-01": [
    { name: "Adana", stateCode: "01", countryCode: "TR" },
  ],
  "TR-27": [
    { name: "Gaziantep", stateCode: "27", countryCode: "TR" },
  ],
  "TR-42": [
    { name: "Konya", stateCode: "42", countryCode: "TR" },
  ],
  
  // Iran Cities
  "IR-01": [
    { name: "Tehran", stateCode: "01", countryCode: "IR" },
  ],
  "IR-24": [
    { name: "Isfahan", stateCode: "24", countryCode: "IR" },
  ],
  "IR-29": [
    { name: "Mashhad", stateCode: "29", countryCode: "IR" },
  ],
  "IR-19": [
    { name: "Shiraz", stateCode: "19", countryCode: "IR" },
  ],
  "IR-08": [
    { name: "Tabriz", stateCode: "08", countryCode: "IR" },
  ],
  "IR-15": [
    { name: "Ahvaz", stateCode: "15", countryCode: "IR" },
  ],
  "IR-22": [
    { name: "Kerman", stateCode: "22", countryCode: "IR" },
  ],
};

// API functions
export const locationAPI = {
  // Get all countries
  getCountries: (): Country[] => {
    return popularCountries;
  },

  // Search countries by name
  searchCountries: (query: string): Country[] => {
    if (!query) return popularCountries;
    const lowerQuery = query.toLowerCase();
    return popularCountries.filter(country =>
      country.name.toLowerCase().includes(lowerQuery)
    );
  },

  // Get states for selected countries
  getStatesForCountries: (countryCodes: string[]): State[] => {
    const states: State[] = [];
    countryCodes.forEach(code => {
      if (statesData[code]) {
        states.push(...statesData[code]);
      }
    });
    return states;
  },

  // Search states
  searchStates: (countryCodes: string[], query: string): State[] => {
    const allStates = locationAPI.getStatesForCountries(countryCodes);
    if (!query) return allStates;
    const lowerQuery = query.toLowerCase();
    return allStates.filter(state =>
      state.name.toLowerCase().includes(lowerQuery)
    );
  },

  // Get cities for selected states
  getCitiesForStates: (stateKeys: string[]): City[] => {
    const cities: City[] = [];
    stateKeys.forEach(key => {
      if (citiesData[key]) {
        cities.push(...citiesData[key]);
      }
    });
    return cities;
  },

  // Search cities
  searchCities: (stateKeys: string[], query: string): City[] => {
    const allCities = locationAPI.getCitiesForStates(stateKeys);
    if (!query) return allCities;
    const lowerQuery = query.toLowerCase();
    return allCities.filter(city =>
      city.name.toLowerCase().includes(lowerQuery)
    );
  },
};
