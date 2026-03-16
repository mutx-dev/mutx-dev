import fs from 'fs';
const f = 'components/app/ApiKeysPageClient.tsx';
let c = fs.readFileSync(f, 'utf8');

// Add newKeyExpires state after newKeyName state
c = c.replace(
  "const [newKeyName, setNewKeyName] = useState('');",
  "const [newKeyName, setNewKeyName] = useState('');\n  const [newKeyExpires, setNewKeyExpires] = useState<number | null>(null);"
);

// Update createKey function - add expires_in_days to payload
c = c.replace(
  "body: JSON.stringify({ name: newKeyName.trim() }),",
  "body: JSON.stringify({ name: newKeyName.trim(), expires_in_days: newKeyExpires }),"
);

// Reset newKeyExpires after successful creation
c = c.replace(
  "setNewKeyName('');\n      fetchKeys();",
  "setNewKeyName('');\n      setNewKeyExpires(null);\n      fetchKeys();"
);

fs.writeFileSync(f, c);
console.log('done');
