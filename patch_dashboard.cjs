const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  "import { PrintDocumentModal } from './PrintDocumentModal';",
  "import { PrintDocumentModal } from './PrintDocumentModal';\nimport { addGift, updateGift, deleteGift, updateEmployee } from '../lib/firebaseService';"
);

// Replace setGifts in handleStartEdit save (update)
content = content.replace(
  /setGifts\(\(prev\) =>[\s\S]*?prev\.map\(\(g\) => \{[\s\S]*?if \(g\.id === editingId\) \{[\s\S]*?return \{([\s\S]*?)\};[\s\S]*?\}[\s\S]*?return g;[\s\S]*?\}\)[\s\S]*?\);/,
  `
      const updatedGift = {
        ...gifts.find(g => g.id === editingId),
$1
      };
      updateGift(updatedGift as GiftItem);
`
);

// Replace setGifts in create (addGift)
content = content.replace(
  /setGifts\(\(prev\) => \[newGift, \.\.\.prev\]\);/,
  "addGift(newGift);"
);

// Replace setStaffList increment
content = content.replace(
  /setStaffList\(\(prev\) =>[\s\S]*?prev\.map\(\(emp\) =>[\s\S]*?emp\.id === activeStaff\.id[\s\S]*?\? \{ \.\.\.emp, giftsCount: \(emp\.giftsCount \|\| 0\) \+ 1 \}[\s\S]*?: emp[\s\S]*?\)[\s\S]*?\);/,
  "updateEmployee({ ...activeStaff, giftsCount: (activeStaff.giftsCount || 0) + 1 });"
);

// Replace handleSaveProfile update
content = content.replace(
  /setStaffList\(\(prev\) =>[\s\S]*?prev\.map\(\(emp\) =>[\s\S]*?emp\.id === activeStaff\.id[\s\S]*?\? \{([\s\S]*?)\}[\s\S]*?: emp[\s\S]*?\)[\s\S]*?\);/,
  "updateEmployee({ ...activeStaff,$1});"
);

// Replace handleDeleteGift
content = content.replace(
  /setGifts\(\(prev\) => prev\.filter\(\(g\) => g\.id !== id\)\);/,
  "deleteGift(id);"
);

// Write back
fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
