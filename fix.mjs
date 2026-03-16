import fs from 'fs';
const f = 'components/app/ApiKeysPageClient.tsx';
let c = fs.readFileSync(f, 'utf8');

// Add EXPIRATION_OPTIONS after interface
c = c.replace(
  /interface ApiKey \{[\s\S]*?expires_at: string \| null;\n\}/,
  `interface ApiKey {
  id: string;
  name: string;
  created_at: string;
  last_used: string | null;
  expires_at: string | null;
}

const EXPIRATION_OPTIONS = [
  { value: null, label: 'Never' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
];
`
);

// Add newKeyExpires state
c = c.replace(
  "const [newKeyName, setNewKeyName] = useState('');",
  "const [newKeyName, setNewKeyName] = useState('');\n  const [newKeyExpires, setNewKeyExpires] = useState<number | null>(null);"
);

// Update createKey function to include expires_in_days
c = c.replace(
  "body: JSON.stringify({ name: newKeyName.trim() }),",
  "body: JSON.stringify({ name: newKeyName.trim(), expires_in_days: newKeyExpires }),"
);

// Reset form after creation  
c = c.replace(
  "setNewKeyName('');\n      fetchKeys();",
  "setNewKeyName('');\n      setNewKeyExpires(null);\n      fetchKeys();"
);

// Add select dropdown - find the input and add select after it
c = c.replace(
  /(className="flex-1 rounded-lg[^>]+>)\s*(\n\s*<button)/,
  `$1</select>$2`
);

c = c.replace(
  /(<input[^>]*className="flex-1[^>]*>)/,
  `$1\n            <select\n              value={newKeyExpires ?? ''}\n              onChange={(e) => setNewKeyExpires(e.target.value ? Number(e.target.value) : null)}\n              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white"\n            >\n              <option value="">Never</option>\n              <option value="30">30 days</option>\n              <option value="60">60 days</option>\n              <option value="90">90 days</option>\n              <option value="180">6 months</option>\n              <option value="365">1 year</option>\n            </select>`
);

// Change "Last used" to "Expires" in list
c = c.replace(
  /<span>Last used: \{formatDate\(key\.last_used\)\}<\/span>/,
  '<span>Expires: {formatDate(key.expires_at)}</span>'
);

fs.writeFileSync(f, c);
console.log('done');
