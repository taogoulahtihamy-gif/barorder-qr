import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fr, en } from '../src/i18n/translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../src');

const KNOWN_TRANSLATION_KEYS = new Set([
  ...Object.keys(fr),
  ...Object.keys(en),
]);

const IGNORE_PATTERNS = [
  /\.(css|svg|png|jpg|jpeg|gif|ico|mp3|woff2?)$/,
  /node_modules/,
  /\.git/,
  /dist/,
  /scripts\//,
  /i18n\//,
  /translations\.js$/,
];

const FRENCH_WORDS = [
  'tableau', 'commandes', 'produits', 'catégories', 'paiements', 'statistiques',
  'paramètres', 'déconnexion', 'chiffre', 'revenu', 'panier', 'moyen',
  'récentes', 'accueil', 'bienvenue', 'parcourir', 'rechercher', 'attente',
  'préparation', 'prête', 'servie', 'payée', 'annulée', 'acceptée',
  'utilisateurs', 'cuisine', 'imprimer', 'modifier', 'supprimer', 'enregistrer',
  'annuler', 'créer', 'ajouter', 'retour', 'client', 'serveur', 'appel',
  'résolu', 'accepter', 'activer', 'désactiver', 'nom', 'email', 'mot de passe',
  'adresse', 'téléphone', 'devise', 'couleur', 'logo', 'slug', 'titre',
  'description', 'prix', 'catégorie', 'disponible', 'promotion', 'offre',
  'chargement', 'statut', 'rôle', 'actions', 'créé', 'modifié', 'supprimé',
  'généré', 'copié', 'numéro', 'tous', 'toutes', 'absolument',
];

function isHardcodedFrench(text) {
  const lower = text.toLowerCase().replace(/[^a-zéèêëàâäôöûüçîï]/g, ' ').trim();
  if (!lower || lower.length < 3) return false;
  const words = lower.split(/\s+/);
  const frenchCount = words.filter((w) => FRENCH_WORDS.includes(w)).length;
  return frenchCount >= Math.ceil(words.length / 2);
}

function scanFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.jsx', '.js', '.tsx', '.ts'].includes(ext)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const lines = content.split('\n');
  const relative = path.relative(SRC, filePath);

  const textInJSX = content.match(/>([^<{]+)</g) || [];
  for (const match of textInJSX) {
    const text = match.slice(1, -1).trim();
    if (
      text &&
      text.length > 2 &&
      !text.startsWith(' ') &&
      !text.startsWith('/') &&
      !text.startsWith('\n') &&
      isHardcodedFrench(text) &&
      knownKeysContains(text)
    ) {
      const lineNum = lines.findIndex((l) => l.includes(text)) + 1;
      issues.push({ file: relative, line: lineNum, text, type: 'hardcoded-text' });
    }
  }

  const placeholderMatches = content.match(/placeholder=["']([^"']+)["']/g) || [];
  for (const match of placeholderMatches) {
    const text = match.replace(/placeholder=["'](.*)["']/, '$1');
    if (text && isHardcodedFrench(text) && !content.includes(`t('${text}')`) && !content.includes(`t("${text}")`)) {
      const lineNum = lines.findIndex((l) => l.includes(text)) + 1;
      issues.push({ file: relative, line: lineNum, text, type: 'hardcoded-placeholder' });
    }
  }

  const titleMatches = content.match(/title=["']([^"']+)["']/g) || [];
  for (const match of titleMatches) {
    const text = match.replace(/title=["'](.*)["']/, '$1');
    if (text && isHardcodedFrench(text) && text.length > 3 && !content.includes(`t('${text}')`) && !content.includes(`t("${text}")`)) {
      const lineNum = lines.findIndex((l) => l.includes(text)) + 1;
      issues.push({ file: relative, line: lineNum, text, type: 'hardcoded-title' });
    }
  }

  const toastMatches = content.match(/toast\.\w+\(['"]([^'"]+)['"]\)/g) || [];
  for (const match of toastMatches) {
    const text = match.replace(/toast\.\w+\(['"](.*)['"]\)/, '$1');
    if (text && isHardcodedFrench(text) && !content.includes(`t('${text}')`) && !content.includes(`t("${text}")`)) {
      const lineNum = lines.findIndex((l) => l.includes(text)) + 1;
      issues.push({ file: relative, line: lineNum, text, type: 'hardcoded-toast' });
    }
  }

  return issues;
}

function knownKeysContains(text) {
  const lower = text.toLowerCase();
  for (const key of KNOWN_TRANSLATION_KEYS) {
    if (key.toLowerCase() === lower) return true;
  }
  return false;
}

function scanDir(dir) {
  const issues = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (IGNORE_PATTERNS.some((p) => p.test(entry.name)) || IGNORE_PATTERNS.some((p) => p.test(fullPath))) continue;
    if (entry.isDirectory()) {
      issues.push(...scanDir(fullPath));
    } else {
      issues.push(...scanFile(fullPath));
    }
  }
  return issues;
}

console.log('🔍 Scanning client/src for hardcoded visible strings...\n');

const issues = scanDir(SRC);

if (issues.length === 0) {
  console.log('✅ No hardcoded visible French/English strings found!');
} else {
  console.log(`⚠️  Found ${issues.length} potential hardcoded strings:\n`);
  const byType = {};
  for (const issue of issues) {
    if (!byType[issue.type]) byType[issue.type] = [];
    byType[issue.type].push(issue);
  }
  for (const [type, items] of Object.entries(byType)) {
    console.log(`  ${type}: ${items.length} occurrences`);
    for (const item of items.slice(0, 10)) {
      console.log(`    - ${item.file}:${item.line} → "${item.text.substring(0, 60)}"`);
    }
    if (items.length > 10) {
      console.log(`    ... and ${items.length - 10} more`);
    }
  }
  console.log('');
}

console.log(`\n📊 Total keys in FR dictionary: ${Object.keys(fr).length}`);
console.log(`📊 Total keys in EN dictionary: ${Object.keys(en).length}`);
