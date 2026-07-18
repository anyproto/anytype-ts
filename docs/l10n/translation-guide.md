# Anytype Translation Guide

> **Audience:** AI translation agents (and human proofreaders) filling gaps in the Anytype
> desktop UI translations. Read this **in full** before translating any batch. It defines the
> product context, the non-negotiable formatting rules, the terminology glossary, and the
> **pending renames** that override the English source.

---

## 1. What is Anytype

Anytype is a **local-first, end-to-end-encrypted personal knowledge base** — "your digital
brain." Users gather, connect, and remix information: notes, tasks, wikis, journals, even small
apps. Data stays **offline-first, private, and encrypted** across devices.

Core mental model (needed to translate correctly):

- **Object** — the atomic unit. Everything is an Object (a note, a task, a person, a bookmark).
- **Type** — the schema/kind of an Object (e.g. *Note*, *Task*, *Page*).
- **Property** — a field on an Object (e.g. *Due date*, *Status*). *(Formerly "Relation" — see §4.)*
- **Query** — a saved, live, filtered view over all Objects of a Type. *(Formerly "Set" — see §4.)*
- **Collection** — a manually curated list of Objects.
- **Channel** — a private, encrypted container that holds Objects and can be shared with members.
  *(Formerly "Space" — see §4.)*
- **Vault** — the local encrypted store of all a user's Channels on a device.
- **Widget** — a dashboard block on the home screen that surfaces Objects.
- **Block** — the composable unit inside the editor (text, image, table, embed…).

**Tone:** calm, clear, friendly, non-jargony. Match the concision of the English source. Prefer
the natural, conventional UI term in each language over literal word-for-word translation.

---

## 2. How translations flow (context)

```
src/json/text.json  (English source of truth — the ONLY hand-edited file)
   → mirror-text.yml copies it to anyproto/l10n-anytype-ts (text.json + locales/en-US.json)
   → Crowdin translates → PRs translations back into l10n-anytype-ts/locales/*.json
   → `bun run update:locale` pulls locales/*.json into dist/lib/json/lang/*.json (gitignored build artifacts)
```

You are translating the **values** of a flat JSON map: `{ "keyName": "English string", ... }`.
There are **2,710 keys**. Keys are stable identifiers — **never translate or reorder keys.**

---

## 3. Golden rules (MUST follow — a violation breaks the app)

1. **Preserve every placeholder exactly.**
   - `%s` — string substitution (printf). Some strings contain **multiple** `%s`; keep the same
     count and order. Example: `%s "%s" is in the Bin`.
   - Do **not** add, remove, reorder, or translate `%s`.
2. **Preserve all HTML markup verbatim.** ~99 strings contain HTML. Keep tags, classes, and
   attributes byte-for-byte; translate **only** the visible text between/around them.
   - Keep: `<b>`, `<br/>`, `<span class='hl'>`, `<p>`, `<ul>`, `<li>`, `<a href='...'>`, etc.
   - Example: `Version <span class='hl'>%s</span> is ready` → translate "Version … is ready",
     leave `<span class='hl'>%s</span>` untouched.
3. **Output valid JSON.** Escape quotes as `\"`. Do not introduce literal newlines inside values.
4. **Keep leading/trailing whitespace and punctuation** exactly as in the source.
5. **Never translate:** the brand name **Anytype**, product proper nouns, URLs, email addresses,
   file extensions, keyboard-key tokens, and anything inside HTML attributes.
6. **Only fill gaps.** Translate a string **only** if it is currently untranslated (its value
   equals the English value). **Never overwrite** a string that already differs from English —
   that is existing human/reviewed work.
7. **Match the target-language UI register** (formality, capitalization). See §6.
8. **Respect UI length limits.** Many strings render in fixed-width elements (buttons, tabs, menu
   items, labels, sidebar). Long-expanding languages (**German**, Russian, Finnish-style) must not
   overflow. For **short source strings (≤ ~25 chars — buttons/labels/menu items/tabs)**, keep the
   translation close to the source length: aim within **~1.3×** the English character count, treat
   **>1.5×** as needs-review, and pick the shortest natural, conventional term. For **long strings**
   (descriptions, prose, errors, onboarding) prioritize clarity — length is flexible. Never pad and
   never add words that aren't in the source.

---

## 4. Pending renames (CRITICAL — these OVERRIDE the English source)

Two product-wide renames are **in progress**. The English source (`text.json`) is **inconsistent**:
some strings still use the old term, some already use the new one, and the key names still carry
the old word. **Regardless of what the English source string says, always translate using the NEW
term.**

| Old term | **New term** | Scope |
|----------|--------------|-------|
| Space    | **Channel**  | everywhere (all user-facing text) |
| Relation | **Property** | everywhere (all user-facing text) |
| Set      | **Query**    | the Object-type **noun** only — NOT the verb "set" |

> If an English source value still says "Space" or "Relation", treat it as if it said "Channel"
> or "Property" and translate accordingly. Keys (e.g. `commonNewSpace`, `blockNameRelation`) keep
> their old names — that is expected; do not let the key spelling change your translation.

**Exceptions — do NOT rename (keep the old term):**

- **"Personal Space"** — a legacy artifact (not created for new users). Keep "Space" here.
- **Disk/storage "space"** — e.g. "Not enough space", "Free space", "save space on your device",
  "run out of space". This means storage, not the container. Keep "space".
- **The Space keyboard key** — e.g. "%s + Space", and the space character (`delimiterSpace`). Keep.
- **"Relations Are Now Properties"** and any string that *announces* the rename. Keep verbatim.
- **The verb "set"** — e.g. "Set as default", "Set a PIN", "Set layout width", "almost all set".
  Only the *noun* Set (the object type) becomes Query, and in the source that rename is already
  complete — so any remaining "set" is the verb; keep it.

### 4a. Canonical target term — **Channel** (was Space)

Use these terms for **Channel** (and stop using the old "Space" word). Rows marked ⚠ need action.

| Lang | Channel (use this) | Note |
|------|--------------------|------|
| be-BY | Канал | ⚠ currently untranslated |
| cs-CZ | Kanál | ⚠ currently untranslated |
| da-DK | Kanal | ✓ established |
| de-DE | Kanal | ✓ established |
| es-ES | Canal | ✓ established |
| fa-IR | کانال | ⚠ untranslated (RTL) |
| fr-FR | **Canal** | ⚠ **currently WRONG — says "Espace" (=Space); fix to "Canal"** |
| hi-IN | चैनल | ⚠ currently untranslated |
| id-ID | Kanal | ✓ established |
| it-IT | Canale | ✓ established |
| ja-JP | チャンネル | ✓ established |
| ko-KR | 채널 | ✓ established |
| lt-LT | Kanalas | ⚠ currently untranslated |
| nl-NL | Kanaal | ⚠ currently untranslated |
| no-NO | Kanal | ⚠ currently untranslated |
| pl-PL | Kanał | ✓ established |
| pt-BR | Canal | ✓ established |
| pt-PT | Canal | ✓ established |
| ro-RO | Canal | ⚠ currently untranslated |
| ru-RU | Канал | ✓ established |
| tr-TR | Kanal | ✓ established |
| uk-UA | Канал | ✓ established |
| vi-VN | Kênh | ⚠ currently untranslated |
| zh-CN | 频道 | ✓ established |
| zh-TW | 頻道 | ✓ established |

*(⚠ terms without a "✓ established" source are suggested canonical forms — proofreaders should
confirm the natural product term for a private, shareable container.)*

### 4b. Canonical target term — **Property** (was Relation)

Use the **Property** term for both "Property" and any remaining "Relation" strings.

| Lang | Property (use this) | Note |
|------|---------------------|------|
| be-BY | Уласцівасць | (from existing Relation translation) |
| cs-CZ | Vlastnost | ⚠ confirm |
| da-DK | Egenskab | ✓ |
| de-DE | Eigenschaft | ✓ |
| es-ES | Propiedad | ✓ (Relation was "Relación" → switch to Propiedad) |
| fa-IR | ویژگی | ✓ (RTL) |
| fr-FR | Propriété | ✓ |
| hi-IN | गुण | ⚠ confirm |
| id-ID | Atribut | ✓ |
| it-IT | Proprietà | ✓ (Relation "Relazione" → switch to Proprietà) |
| ja-JP | プロパティ | ✓ (already merged) |
| ko-KR | 속성 | ✓ |
| lt-LT | Savybė | ⚠ confirm |
| nl-NL | Eigenschap | ✓ |
| no-NO | Egenskap | ✓ |
| pl-PL | Właściwość | ✓ (Relation "Relacja" → switch) |
| pt-BR | Propriedade | ✓ |
| pt-PT | Propriedade | ✓ |
| ro-RO | Proprietate | ⚠ confirm |
| ru-RU | Свойство | ✓ (already merged) |
| tr-TR | Özellik | ✓ |
| uk-UA | Властивість | ⚠ confirm |
| vi-VN | Thuộc tính | ✓ |
| zh-CN | 属性 | ✓ |
| zh-TW | 屬性 | ⚠ existing value has junk prefix `"Property - 屬性"` — use clean 屬性 |

### 4c. Canonical target term — **Query** (was Set)

Use the **Query** term (and its plural for "Queries"). The source rename is already done; this is
for translations. `id-ID` has a stale plural (`widgetSet = "Daftar"` = "List") — use the Kueri form.

| Lang | Query (use this) | Note |
|------|------------------|------|
| be-BY | Запыт | ✓ (plural "Queries" still =EN) |
| cs-CZ | Dotaz | ✓ (plural =EN) |
| da-DK | Forespørgsel | ✓ |
| de-DE | Abfrage | ✓ |
| es-ES | Consulta | ✓ |
| fa-IR | جستار | ✓ (RTL) |
| fr-FR | Requête | ✓ |
| hi-IN | क्वेरी | ⚠ untranslated (suggested) |
| id-ID | Kueri | ✓ — but fix stale plural "Daftar" → "Kueri" |
| it-IT | Query | ⚠ untranslated — confirm (or "Interrogazione") |
| ja-JP | クエリ | ✓ |
| ko-KR | 쿼리 | ✓ |
| lt-LT | Užklausa | ⚠ untranslated (suggested) |
| nl-NL | Verzoek | ✓ |
| no-NO | Spørring | ✓ |
| pl-PL | Zapytanie | ✓ |
| pt-BR | Consulta | ✓ |
| pt-PT | Consulta | ✓ |
| ro-RO | Interogare | ⚠ untranslated (suggested) |
| ru-RU | Запрос | ✓ |
| tr-TR | Sorgu | ✓ |
| uk-UA | Запит | ✓ |
| vi-VN | Truy vấn | ✓ |
| zh-CN | 查询 | ✓ |
| zh-TW | 查詢 | ✓ |

---

## 5. Glossary — core terms (keep consistent)

These terms have **established** translations. Reuse them exactly for consistency. `=EN` means the
language keeps the English word.

| Term | Keep EN? | ru | de | fr | es | ja | zh-CN | ko |
|------|----------|----|----|----|----|----|-------|----|
| **Object** | translate | Объект | Objekt | Objet | Objeto | オブジェクト | 对象 | 객체 |
| **Collection** | translate | Коллекция | Sammlung | Collection | Colección | コレクション | 合集 | 컬렉션 |
| **Vault** | translate | Хранилище | Tresor | Coffre-fort | Arca | 保管庫 | 库 | 보관소 |
| **Widget** | usually **keep EN** | Виджет | =EN | =EN | =EN | ウィジェット | 小部件 | 위젯 |
| **Bin** | translate | Корзина | Papierkorb | Corbeille | Papelera | ゴミ箱 | 回收站 | — |
| **Owner** | translate | Владелец | Eigentümer | Propriétaire | Propietario | 所有者 | 所有者 | — |
| **Query** | translate | Запрос | Abfrage | Requête | Consulta | クエリ | 查询 | — |
| **Template** | translate | Шаблон | — | Modèle | Plantilla | テンプレート | 模板 | — |
| **Layout** | translate | Макет | — | Mise en page | Diseño | レイアウト | 布局 | — |

> **Do not translate:** `Anytype` (brand), `%s`, HTML tags/attributes, URLs, emails.
> **Type** rarely appears as a standalone string; when it does, use the natural UI term for a
> schema/kind, consistent within a language. **Set** is renamed to **Query** (§4c) — never use
> "Set" as a noun in translations.

### 5a. When to keep the English term (don't force awkward translations)

Prefer the **English fallback** when a native translation would be uncommon, awkward, or unclear
for software users — this is standard practice in many apps. Judge per term, per language.

**Keep English when:**
- The term is a technical/software concept whose native translation is rarely used or sounds
  unnatural in that language's software UX — users know the English loanword better.
- Similar apps in that locale keep the term in English.
- The English word is short and widely recognized by that audience.

Terms that commonly stay English in many locales: *Widget, Dashboard, Query, Sync, Cache, Markdown,
Emoji, PDF, URL, ID, PIN, QR*.

**Translate when** a natural, widely-understood native term exists — this is the vast majority of UI
text (Save, Delete, Settings, Search, Member, Owner, Object, Channel, Property, Collection…).

**Rules for keeping English:**
- **Be consistent.** If you keep a term in English in one string, keep it English *everywhere* in
  that language — never mix the English word and a translated word for the same concept.
- The three renames (**Channel, Property, Query**) already have established native translations in
  most languages — use those. Fall back to English only where a language has **no** good native
  term and its existing UI clearly favors English (e.g. Italian "Query").
- When unsure, match what that language's existing, reviewed translations already do.

---

## 6. Per-language register notes

- **Formality:** default to the register the app already uses in that language. de → **du**
  (informal), fr → **vous**, ru/uk → **вы/ви**, es → **tú**, ja → polite/丁寧 (です/ます), ko → 해요체.
  *(Proofreaders: confirm/adjust; consistency within a language matters more than the specific choice.)*
- **fa-IR** is **right-to-left**. Translate text normally; do not reorder placeholders or markup.
- **Capitalization:** English UI Title Case usually becomes sentence case in de/fr/es/ru/etc. Follow
  each language's UI conventions, not English capitalization.

---

## 7. Reproducing / updating this data

The glossary and gap numbers are mined from the live locale files. To refresh:

```bash
bun run update:locale        # pull latest locales/*.json into dist/lib/json/lang/
# then re-run the gap + glossary mining scripts (see docs/l10n/ tooling)
```

- **Source of truth:** `src/json/text.json` (English).
- **Reference translations:** `dist/lib/json/lang/<lang>.json` (pulled from `l10n-anytype-ts`).
- A string is an **untranslated gap** iff `locale[key] === en[key]`.
