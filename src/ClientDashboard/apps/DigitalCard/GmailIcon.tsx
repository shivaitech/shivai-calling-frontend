/** Gmail's four-colour "M" mark, for the Email button. */
export default function GmailIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 42) / 52} viewBox="0 0 52 42" aria-hidden="true" style={{ flex: "none" }}>
      <path fill="#4285F4" d="M3.5 42h8V22.5L0 13.75V38.5c0 1.94 1.57 3.5 3.5 3.5z" />
      <path fill="#34A853" d="M40.5 42h8c1.94 0 3.5-1.57 3.5-3.5V13.75L40.5 22.5z" />
      <path fill="#FBBC04" d="M40.5 7.33V22.5L52 13.75V9.08c0-4.33-4.94-6.8-8.4-4.2z" />
      <path fill="#EA4335" d="M11.5 22.5V7.33L26 18.21l14.5-10.88V22.5L26 33.38z" />
      <path fill="#C5221F" d="M0 9.08v4.67l11.5 8.75V7.33L8.4 4.88C4.93 2.28 0 4.75 0 9.08z" />
    </svg>
  );
}
