const sources = [
  { id: 'finest-pl-2026', name: 'Topps Finest Premier League', season: '2026', cards: '300 cartes de base', type: 'Premium', color: 'gold', pages: 16, text: 'data/checklist-0.txt', pdf: 'https://cdn.shopify.com/s/files/1/0739/2015/1805/files/Finest_Premier_League_Checklist.pdf?v=1774359572' },
  { id: 'psg-team-set-2025', name: 'Topps Paris Saint-Germain Team Set', season: '2025/26', cards: 'Checklist officielle', type: 'Team set', color: 'navy', pages: 3, text: 'data/checklist-1.txt', pdf: 'https://cdn.shopify.com/s/files/1/0739/2015/1805/files/Topps_Paris_Saint-Germain_2025-26_Team_Set_Checklist.pdf?v=1769618834' },
  { id: 'ucc-deco-2025', name: 'Topps UEFA Club Competitions Deco', season: '2025/26', cards: '192 cartes', type: 'Premium', color: 'purple', pages: 15, text: 'data/checklist-2.txt', pdf: 'https://cdn.shopify.com/s/files/1/0739/2015/1805/files/Topps_UCC_Deco_2025-26_Checklist.pdf?v=1762427780' },
  { id: 'merlin-pl-2026', name: 'Merlin Premier League', season: '2026', cards: '200 cartes de base', type: 'Hobby', color: 'red', pages: 16, text: 'data/checklist-3.txt', pdf: 'https://cdn.shopify.com/s/files/1/0739/2015/1805/files/Merlin_Premier_League_2026_Checklist.pdf?v=1777542072' },
  { id: 'chrome-ucc-2025', name: 'Topps Chrome UEFA Club Competitions', season: '2025/26', cards: '200 cartes de base', type: 'Chrome', color: 'blue', pages: 22, text: 'data/checklist-4.txt', pdf: 'https://cdn.shopify.com/s/files/1/0739/2015/1805/files/26TUCC_ChromeChecklist_FINAL_v3.pdf?v=1775637283' }
];

const teams = ['Paris Saint-Germain', 'Manchester United', 'Manchester City', 'Manchester City FC', 'Nottingham Forest', 'Wolverhampton Wanderers', 'Brighton & Hove Albion', 'AFC Bournemouth', 'Crystal Palace', 'Tottenham Hotspur', 'West Ham United', 'Newcastle United', 'Aston Villa', 'Leeds United', 'Liverpool FC', 'Chelsea FC', 'Chelsea', 'Arsenal FC', 'Arsenal', 'Everton', 'Fulham', 'Brentford', 'Burnley FC', 'Sunderland', 'FC Barcelona', 'Real Madrid C.F.', 'Real Betis Balompié', 'FC Bayern München', 'FC Bayern Munich', 'FC Internazionale Milano', 'FC Internazionle Milano', 'FC Internazionale', 'Borussia Dortmund', 'Bayer 04 Leverkusen', 'VfB Stuttgart', 'ACF Fiorentina', 'SSC Napoli', 'AS Roma', 'Atalanta BC', 'Juventus', 'FC Porto', 'LOSC Lille', 'F.C. Copenhagen', 'SL Benfica', 'Sporting Clube de Portugal', 'Atlético de Madrid', 'Athletic Club', 'AFC Ajax', 'PSV Eindhoven', 'Celtic FC', 'Rangers F.C.', 'Eintracht Frankfurt', 'KRC Genk', 'RC Strasbourg Alsace', 'AS Monaco', 'AC Milan'];
const teamPattern = new RegExp(`\\s*(${teams.sort((a, b) => b.length - a.length).map(escapeRegex).join('|')})(?:\\s*Rookie)?$`, 'i');
let entries = [];

const grid = document.querySelector('#collection-grid');
const collectionSearch = document.querySelector('#search');
const playerSearch = document.querySelector('#player-search');
const playerSort = document.querySelector('#player-sort');
const playerFullscreen = document.querySelector('#player-fullscreen');
const playerList = document.querySelector('#player-list');
const playerStatus = document.querySelector('#player-status');
const dialog = document.querySelector('#collection-dialog');

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function normalise(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function fixEncoding(value) {
  if (!/[ÃÂâ]/.test(value)) return value;
  try { return decodeURIComponent(escape(value)); } catch { return value; }
}

function renderCollections() {
  const query = normalise(collectionSearch.value.trim());
  const visible = sources.filter(source => normalise(`${source.name} ${source.season}`).includes(query));
  grid.innerHTML = visible.map(source => `<article class="collection-card"><div class="collection-art ${source.color}"><small>TOPPS · FOOTBALL</small><strong>${source.name.replace('Topps ', '').split(' ').slice(0, 3).join('<br />')}</strong><i>${source.season}</i><span class="badge">PDF officiel</span></div><div class="card-details"><p>Football <span>•</span> ${source.type}</p><h3>${source.name}</h3><div><span>${source.season}</span><span>${source.cards}</span><button aria-label="Voir ${source.name}" data-open="${source.id}">→</button></div></div></article>`).join('') || '<p class="empty">Aucune extension ne correspond à votre recherche.</p>';
}

function parseChecklist(text, source) {
  let section = 'Checklist';
  let category = 'BASE';
  return fixEncoding(text).replace(/\\n/g, '\n').split(/\r?\n/).flatMap(raw => {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (/^[A-Z][A-Z &’'/-]{3,}$/.test(line) && !/^CHECKLIST$/.test(line)) {
      if (/^(BASE|INSERTS?|AUTOGRAPHS?|AUTOGRAPH CARDS|RELICS?)$/.test(line)) { category = line.startsWith('AUTO') ? 'AUTOGRAPH' : line.startsWith('INSERT') ? 'INSERT' : line.startsWith('RELIC') ? 'RELIC' : 'BASE'; return []; }
      section = titleCase(line); return [];
    }
    if (!/^(?:[A-Z]{1,7}-)?[A-Z0-9]+\s+/.test(line)) return [];
    const match = line.match(/^([A-Z]{1,7}-)?([A-Z0-9]+)\s+(.+)$/);
    if (!match) return [];
    const rookie = /Rookie\s*$/i.test(match[3]);
    let textPart = match[3].replace(/\s*(Rookie|Veteran|Former Player|Legend|Retired|On-Card)\s*$/i, '');
    const teamMatch = textPart.match(teamPattern);
    if (!teamMatch) return [];
    const player = textPart.slice(0, teamMatch.index).trim();
    if (player.length < 3 || /^(Base|Insert|Autograph|Checklist|Number)$/i.test(player)) return [];
    return [{ player, key: normalise(player), team: teamMatch[1], ref: `${match[1] || ''}${match[2]}`, section, category, rookie, sourceId: source.id }];
  });
}

function titleCase(value) { return value.toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }

function rarityFor(entry) {
  const label = normalise(`${entry.category || ''} ${entry.section}`);
  if (/(autograph|auto|relic|only1|superfractor|mythical)/.test(label)) return { stars: 5, label: 'Très rare' };
  if (/(variation|short print|ssp|rainbow|nightmare|magnum|mask off|fusion)/.test(label)) return { stars: 4, label: 'Rare' };
  if (/(base|first team|current stars)/.test(label)) return { stars: 1, label: 'Base' };
  return { stars: 3, label: 'Insert' };
}

function categoryFor(entry) {
  if (entry.category && entry.category !== 'BASE') return entry.category;
  return /(autograph|auto|relic)/i.test(entry.section) ? 'AUTOGRAPH' : /(base|first team|current stars)/i.test(entry.section) ? 'BASE' : 'INSERT';
}

function categoryRank(category) { return ({ AUTOGRAPH: 0, RELIC: 0, BASE: 1, INSERT: 2 })[category] ?? 3; }

function stars(rarity) { return `<span class="stars" aria-label="Rareté : ${rarity.label}, ${rarity.stars} étoiles">${'★'.repeat(rarity.stars)}${'☆'.repeat(5 - rarity.stars)}</span>`; }

const fallback = [
  ['Erling Haaland', 'Manchester City', 'finest-pl-2026'], ['Cole Palmer', 'Chelsea', 'finest-pl-2026'], ['Mohamed Salah', 'Liverpool FC', 'finest-pl-2026'], ['Viktor Gyökeres', 'Arsenal', 'finest-pl-2026'], ['Lionel Messi', 'Paris Saint-Germain', 'psg-team-set-2025'], ['Ousmane Dembélé', 'Paris Saint-Germain', 'psg-team-set-2025'], ['Désiré Doué', 'Paris Saint-Germain', 'psg-team-set-2025'], ['Lamine Yamal', 'FC Barcelona', 'ucc-deco-2025'], ['Kylian Mbappé', 'Real Madrid C.F.', 'ucc-deco-2025'], ['Viktor Gyökeres', 'Arsenal', 'merlin-pl-2026']
].map(([player, team, sourceId], index) => ({ player, key: normalise(player), team, ref: `Index-${index + 1}`, section: 'Checklist', sourceId }));

function getPlayers() {
  const grouped = new Map();
  entries.forEach(entry => {
    if (!grouped.has(entry.key)) grouped.set(entry.key, { name: entry.player, appearances: [] });
    const player = grouped.get(entry.key);
    if (!player.appearances.some(a => a.sourceId === entry.sourceId && a.ref === entry.ref)) player.appearances.push(entry);
  });
  return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function renderPlayers() {
  const query = normalise(playerSearch.value.trim());
  const players = getPlayers().filter(player => normalise(player.name).includes(query));
  players.forEach(player => {
    player.maxRarity = Math.max(...player.appearances.map(item => rarityFor(item).stars));
    player.extensions = new Set(player.appearances.map(item => item.sourceId)).size;
  });
  if (playerSort.value === 'rarity') players.sort((a, b) => b.maxRarity - a.maxRarity || b.extensions - a.extensions || a.name.localeCompare(b.name, 'fr'));
  if (playerSort.value === 'extensions') players.sort((a, b) => b.extensions - a.extensions || b.maxRarity - a.maxRarity || a.name.localeCompare(b.name, 'fr'));
  if (playerSort.value === 'name') players.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const visible = players;
  playerList.innerHTML = visible.map(player => {
    return `<button class="player-row" type="button" data-player="${encodeURIComponent(player.name)}"><span class="player-name">${player.name}</span><span class="player-rarity">${stars({ stars: player.maxRarity, label: 'Rareté maximale' })}<small>${player.extensions} extension${player.extensions > 1 ? 's' : ''}</small></span><b>→</b></button>`;
  }).join('') || '<p class="empty">Aucun joueur ne correspond à cette recherche.</p>';
  playerStatus.textContent = `${players.length} joueur${players.length > 1 ? 's' : ''} trouvé${players.length > 1 ? 's' : ''} · ${entries.length} références indexées depuis les PDF Topps.`;
}

function openCollection(id) {
  const source = sources.find(item => item.id === id); if (!source) return;
  const appearances = entries.filter(entry => entry.sourceId === id);
  const players = new Set(appearances.map(entry => entry.key)).size;
  const clubs = new Map();
  appearances.forEach(entry => { if (!clubs.has(entry.team)) clubs.set(entry.team, []); clubs.get(entry.team).push(entry); });
  const clubCards = [...clubs.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr')).map(([club, cards]) => {
    const categories = new Map();
    cards.forEach(entry => {
      const category = categoryFor(entry);
      if (!categories.has(category)) categories.set(category, new Map());
      const styles = categories.get(category);
      if (!styles.has(entry.section)) styles.set(entry.section, []);
      styles.get(entry.section).push(entry);
    });
    const content = [...categories.entries()].sort(([a], [b]) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, 'fr')).map(([category, styles]) => `<section class="club-category"><h4>${category}</h4>${[...styles.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr')).map(([style, styleCards]) => `<div class="card-style"><h5>${style}</h5>${styleCards.sort((a, b) => a.player.localeCompare(b.player, 'fr') || a.ref.localeCompare(b.ref)).map(entry => `<button type="button" data-player="${encodeURIComponent(entry.player)}"><span>${entry.player}${entry.rookie ? '<i>Rookie</i>' : ''}</span><small>${entry.ref}</small><b>↗</b></button>`).join('')}</div>`).join('')}</section>`).join('');
    return `<article class="club-card"><header><span class="club-badge">${club.split(' ').map(part => part[0]).join('').slice(0, 3)}</span><h3>${club}</h3><small>${cards.length} cartes</small></header>${content}</article>`;
  }).join('');
  dialog.classList.add('collection-dialog');
  document.querySelector('#dialog-content').innerHTML = `<p class="eyebrow">Checklist officielle Topps</p><h2>${source.name}</h2><p class="dialog-intro">Football · Saison ${source.season} · ${source.pages} pages</p><div class="dialog-stats"><div><b>${source.cards}</b><span>format annoncé</span></div><div><b>${players || '—'}</b><span>joueurs indexés</span></div><div><b>${appearances.length || '—'}</b><span>références lues</span></div></div><div class="club-board">${clubCards}</div><a class="button button-primary" href="${source.pdf}" target="_blank" rel="noopener">Ouvrir la checklist Topps <span>↗</span></a>`;
  dialog.showModal();
}

function openPlayer(name) {
  const player = getPlayers().find(item => item.name === name); if (!player) return;
  dialog.classList.remove('collection-dialog');
  const grouped = new Map();
  player.appearances.forEach(appearance => {
    if (!grouped.has(appearance.sourceId)) grouped.set(appearance.sourceId, []);
    grouped.get(appearance.sourceId).push(appearance);
  });
  const rows = [...grouped.entries()].map(([sourceId, appearances]) => {
    const source = sources.find(item => item.id === sourceId);
    const refs = appearances.map(item => `${categoryFor(item)} · ${item.section} · ${item.ref}`).join('<br />');
    return `<article class="appearance"><div class="appearance-art ${source.color}"><small>TOPPS</small><b>${source.name.replace('Topps ', '').split(' ').slice(0, 2).join('<br />')}</b><i>${source.season}</i></div><div><p>${source.season} · ${source.type}</p><h3>${source.name}</h3><div class="appearance-refs">${refs}</div></div><a href="${source.pdf}" target="_blank" rel="noopener" aria-label="Checklist ${source.name}">↗</a></article>`;
  }).join('');
  document.querySelector('#dialog-content').innerHTML = `<p class="eyebrow">Index joueur</p><h2>${player.name}</h2><p class="dialog-intro">${grouped.size} extension${grouped.size > 1 ? 's' : ''} Topps Football répertoriée${grouped.size > 1 ? 's' : ''}</p><div class="player-appearances">${rows}</div>`;
  dialog.showModal();
}

async function loadChecklists() {
  const loaded = await Promise.all(sources.map(async source => {
    try { const response = await fetch(source.text); return response.ok ? parseChecklist(await response.text(), source) : []; } catch { return []; }
  }));
  entries = loaded.flat();
  if (!entries.length) entries = fallback;
  document.querySelector('#hero-player-count').textContent = getPlayers().length;
  document.querySelector('#collection-count').textContent = sources.length;
  renderPlayers();
}

collectionSearch.addEventListener('input', renderCollections);
playerSearch.addEventListener('input', renderPlayers);
playerSort.addEventListener('change', renderPlayers);
playerFullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector('#joueurs').requestFullscreen();
  } catch { document.querySelector('#joueurs').scrollIntoView({ behavior: 'smooth' }); }
});
document.addEventListener('click', event => {
  const collectionId = event.target.closest('[data-open]')?.dataset.open;
  if (collectionId) openCollection(collectionId);
  const player = event.target.closest('[data-player]')?.dataset.player;
  if (player) openPlayer(decodeURIComponent(player));
});
document.querySelector('.close').addEventListener('click', () => dialog.close());
renderCollections();
loadChecklists();
