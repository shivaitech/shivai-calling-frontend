// Location data and API for countries, states, and cities
// This uses a public API for location data

export interface Country {
  code: string;
  name: string;
}

export interface State {
  code: string;
  name: string;
  countryCode: string;
}

export interface City {
  name: string;
  stateCode: string;
  countryCode: string;
}

// Popular countries list
export const popularCountries: Country[] = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CV", name: "Cape Verde" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "KP", name: "North Korea" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

// Sample states/provinces data (this would ideally come from an API)
export const statesData: Record<string, State[]> = {
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
  "US-CA": [
    { name: "Los Angeles", stateCode: "CA", countryCode: "US" },
    { name: "San Francisco", stateCode: "CA", countryCode: "US" },
    { name: "San Diego", stateCode: "CA", countryCode: "US" },
    { name: "San Jose", stateCode: "CA", countryCode: "US" },
    { name: "Sacramento", stateCode: "CA", countryCode: "US" },
  ],
  "US-NY": [
    { name: "New York City", stateCode: "NY", countryCode: "US" },
    { name: "Buffalo", stateCode: "NY", countryCode: "US" },
    { name: "Rochester", stateCode: "NY", countryCode: "US" },
    { name: "Albany", stateCode: "NY", countryCode: "US" },
  ],
  "US-TX": [
    { name: "Houston", stateCode: "TX", countryCode: "US" },
    { name: "Dallas", stateCode: "TX", countryCode: "US" },
    { name: "Austin", stateCode: "TX", countryCode: "US" },
    { name: "San Antonio", stateCode: "TX", countryCode: "US" },
  ],
  "US-FL": [
    { name: "Miami", stateCode: "FL", countryCode: "US" },
    { name: "Orlando", stateCode: "FL", countryCode: "US" },
    { name: "Tampa", stateCode: "FL", countryCode: "US" },
    { name: "Jacksonville", stateCode: "FL", countryCode: "US" },
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
    { name: "Mumbai", stateCode: "MH", countryCode: "IN" },
    { name: "Pune", stateCode: "MH", countryCode: "IN" },
    { name: "Nagpur", stateCode: "MH", countryCode: "IN" },
  ],
  "IN-DL": [
    { name: "New Delhi", stateCode: "DL", countryCode: "IN" },
  ],
  "IN-KA": [
    { name: "Bangalore", stateCode: "KA", countryCode: "IN" },
    { name: "Mysore", stateCode: "KA", countryCode: "IN" },
  ],
  "IN-TG": [
    { name: "Hyderabad", stateCode: "TG", countryCode: "IN" },
    { name: "Warangal", stateCode: "TG", countryCode: "IN" },
    { name: "Nizamabad", stateCode: "TG", countryCode: "IN" },
    { name: "Khammam", stateCode: "TG", countryCode: "IN" },
    { name: "Karimnagar", stateCode: "TG", countryCode: "IN" },
  ],
  "IN-TN": [
    { name: "Chennai", stateCode: "TN", countryCode: "IN" },
    { name: "Coimbatore", stateCode: "TN", countryCode: "IN" },
    { name: "Madurai", stateCode: "TN", countryCode: "IN" },
    { name: "Tiruchirappalli", stateCode: "TN", countryCode: "IN" },
  ],
  "IN-UP": [
    { name: "Lucknow", stateCode: "UP", countryCode: "IN" },
    { name: "Kanpur", stateCode: "UP", countryCode: "IN" },
    { name: "Agra", stateCode: "UP", countryCode: "IN" },
    { name: "Varanasi", stateCode: "UP", countryCode: "IN" },
    { name: "Noida", stateCode: "UP", countryCode: "IN" },
  ],
  "IN-GJ": [
    { name: "Ahmedabad", stateCode: "GJ", countryCode: "IN" },
    { name: "Surat", stateCode: "GJ", countryCode: "IN" },
    { name: "Vadodara", stateCode: "GJ", countryCode: "IN" },
    { name: "Rajkot", stateCode: "GJ", countryCode: "IN" },
  ],
  "IN-RJ": [
    { name: "Jaipur", stateCode: "RJ", countryCode: "IN" },
    { name: "Jodhpur", stateCode: "RJ", countryCode: "IN" },
    { name: "Udaipur", stateCode: "RJ", countryCode: "IN" },
  ],
  "IN-WB": [
    { name: "Kolkata", stateCode: "WB", countryCode: "IN" },
    { name: "Howrah", stateCode: "WB", countryCode: "IN" },
    { name: "Durgapur", stateCode: "WB", countryCode: "IN" },
  ],
  "IN-AP": [
    { name: "Visakhapatnam", stateCode: "AP", countryCode: "IN" },
    { name: "Vijayawada", stateCode: "AP", countryCode: "IN" },
    { name: "Guntur", stateCode: "AP", countryCode: "IN" },
  ],
  "IN-HR": [
    { name: "Gurugram", stateCode: "HR", countryCode: "IN" },
    { name: "Faridabad", stateCode: "HR", countryCode: "IN" },
    { name: "Panipat", stateCode: "HR", countryCode: "IN" },
  ],
  "IN-PB": [
    { name: "Chandigarh", stateCode: "PB", countryCode: "IN" },
    { name: "Ludhiana", stateCode: "PB", countryCode: "IN" },
    { name: "Amritsar", stateCode: "PB", countryCode: "IN" },
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
