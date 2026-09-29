/**
 * The story behind each movement: why it arose, how it began, the moment it can be dated to, and
 * the people credited with starting it. Kept apart from movements.ts so the visual data stays lean.
 *
 * `born` is the founding moment in one line. `pioneers` are the originators (not every later master);
 * where a tradition has no recorded founder, the entry names the culture and the earliest known works.
 */
export interface History {
  born: string
  pioneers: { name: string; note: string }[]
  why: string
  birth: string
}

export const HISTORIES: Record<string, History> = {
  'cave-art': {
    born: 'c. 45,500 years ago · Leang Tedongnge, Sulawesi (oldest dated figurative painting)',
    pioneers: [
      { name: 'Anonymous Palaeolithic painters', note: 'Sulawesi, Chauvet (c. 36,000 BP), Lascaux (c. 17,000 BP), Altamira' },
      { name: 'María & Marcelino Sanz de Sautuola', note: 'Recognised Altamira’s paintings in 1879, the first cave art identified as prehistoric' },
    ],
    why: 'Early humans needed to hold the animals they depended on — to remember, to teach the hunt, and very probably to reach the spirit world. Painting made an absent thing present.',
    birth: 'Hunter-gatherers ground red and yellow ochre, burnt wood into charcoal and blew pigment through hollow bones around their hands. They worked by flickering lamplight deep underground, using the bulges of the rock as the bodies of bison and horses.',
  },
  prehistoric: {
    born: 'c. 40,000 BCE figurines → c. 9500 BCE Göbekli Tepe → c. 3000 BCE Stonehenge',
    pioneers: [
      { name: 'Makers of the Hohle Fels figurine', note: 'Swabian Jura, c. 40,000 years ago — among the oldest carved human figures' },
      { name: 'Builders of Göbekli Tepe', note: 'Anatolia, c. 9500 BCE — the earliest known monumental stone enclosures' },
      { name: 'Neolithic communities of Britain & Brittany', note: 'Stonehenge, Carnac and Newgrange' },
    ],
    why: 'As people settled and farmed, time became a matter of survival. Sun, seasons and the dead had to be tracked and honoured, so communities made markers that would last longer than any single life.',
    birth: 'Portable carving came first — ivory and stone bodies small enough to hold. Settled societies then organised hundreds of hands with antler picks, levers and rope to raise stones aligned to solstice sunrise and sunset.',
  },
  indigenous: {
    born: 'c. 30,000+ years ago in Australia · still a living tradition',
    pioneers: [
      { name: 'First Peoples of Australia', note: 'Kimberley and Arnhem Land rock art — one of the oldest continuous art traditions' },
      { name: 'Papunya Tula artists', note: 'Kaapa Tjampitjinpa, Clifford Possum Tjapaltjarri and others began painting on board and canvas in 1971' },
      { name: 'Emily Kame Kngwarreye', note: 'Utopia, 1980s–90s — carried desert painting into international modern art' },
    ],
    why: 'Pattern carries law, kinship and the knowledge of Country. A painting is a map, a title deed and a sacred story together, so it had to be passed on precisely.',
    birth: 'For millennia these designs were painted on rock, bark, sand and bodies. In 1971 at Papunya, men painting a school mural moved the Dreaming designs onto board and canvas, and the acrylic dot style of the Western Desert was born.',
  },
  mesopotamian: {
    born: 'c. 3500 BCE · Uruk, southern Iraq',
    pioneers: [
      { name: 'Sumerian artisans of Uruk', note: 'Warka Vase (c. 3200 BCE), cylinder seals and the earliest writing' },
      { name: 'Ur-Nammu of Ur', note: 'Commissioned the Great Ziggurat of Ur, c. 2100 BCE' },
      { name: 'Nebuchadnezzar II', note: 'Ishtar Gate of Babylon in glazed brick, c. 575 BCE' },
    ],
    why: 'The first cities needed to show who ruled, which gods protected them and who owned what. Art became a tool of the state — propaganda, record and prayer at once.',
    birth: 'In Uruk, temple administrators pressed marks into clay and carved tiny cylinder seals that could be rolled into endless friezes. Priests and kings raised stepped mud-brick mountains so their gods could come down to the city.',
  },
  egyptian: {
    born: 'c. 3100 BCE · unification of Egypt, Narmer Palette',
    pioneers: [
      { name: 'Craftsmen of King Narmer', note: 'The Narmer Palette already uses the registers and composite figure of Egyptian style' },
      { name: 'Imhotep', note: 'Architect of Djoser’s Step Pyramid, c. 2670 BCE — the first great stone monument' },
    ],
    why: 'Egyptians believed an image could keep a person alive forever. Art therefore had to be clear, complete and permanent rather than lifelike for a moment.',
    birth: 'When Upper and Lower Egypt were unified, royal workshops fixed a canon: a proportional grid, the head in profile with the eye shown whole, and hieroglyphs integrated with images. The canon stayed remarkably stable for 3,000 years.',
  },
  mesoamerican: {
    born: 'c. 1500–1200 BCE · Olmec San Lorenzo, Gulf Coast of Mexico',
    pioneers: [
      { name: 'Olmec sculptors', note: 'Colossal basalt heads and jade figures — the “mother culture” of Mesoamerica' },
      { name: 'Maya scribes and painters', note: 'Glyphic writing, stelae and the Bonampak murals (c. 790 CE)' },
      { name: 'Mexica (Aztec) sculptors', note: 'The Sun Stone, c. 1502' },
    ],
    why: 'Mesoamerican societies saw time as sacred cycles that had to be tracked and fed through ritual. Buildings and carvings made the calendar and the cosmos physical.',
    birth: 'Olmec carvers moved enormous basalt boulders to shape portraits of rulers. Later cultures built plazas and stepped pyramids aligned to the sun and Venus, and wrapped them in glyphs and step-fret meanders.',
  },
  greek: {
    born: 'c. 800 BCE Geometric pottery → 480 BCE Classical style (the Kritios Boy)',
    pioneers: [
      { name: 'Polykleitos', note: 'Wrote the Canon, a treatise on ideal human proportion, c. 450 BCE' },
      { name: 'Phidias', note: 'Directed the Parthenon sculptures, 447–432 BCE' },
      { name: 'Ictinus & Callicrates', note: 'Architects of the Parthenon' },
    ],
    why: 'Greek city-states prized reason, athletics and civic pride. Showing the perfect human body was a way to show order in the world, and gods made in human form.',
    birth: 'Stiff, Egyptian-influenced kouroi gradually loosened. Around 480 BCE sculptors shifted a figure’s weight onto one leg (contrapposto) and the statue suddenly seemed alive. Mathematics then gave temples and bodies shared ratios.',
  },
  celtic: {
    born: 'c. 450 BCE · La Tène culture (named after a site in Switzerland)',
    pioneers: [
      { name: 'La Tène metalsmiths', note: 'Shields, torcs and mirrors decorated with spirals and curving vegetal forms' },
      { name: 'Monks of Iona and Lindisfarne', note: 'Book of Durrow, Lindisfarne Gospels (c. 715) and Book of Kells (c. 800)' },
    ],
    why: 'For a society without monumental cities, prestige lived in portable objects — weapons, jewellery, holy books. Interlace suggested eternity and protection, and dazzled the eye.',
    birth: 'Iron Age craftsmen turned Greek and Etruscan plant motifs into restless abstract curves. After Christianity arrived, Irish and Northumbrian monks fused this with Germanic animal interlace in illuminated gospels.',
  },
  'chinese-calligraphy': {
    born: 'c. 1200 BCE oracle-bone script · 221 BCE script standardised under Qin',
    pioneers: [
      { name: 'Shang dynasty diviners', note: 'Oracle-bone inscriptions, the earliest mature Chinese writing' },
      { name: 'Li Si', note: 'Chancellor of Qin; standardised the small seal script in 221 BCE' },
      { name: 'Wang Xizhi', note: '303–361; the “Sage of Calligraphy”, Preface to the Orchid Pavilion (353)' },
    ],
    why: 'In China the brushstroke was believed to reveal a person’s character. Writing beautifully was moral self-cultivation, and it was expected of every scholar-official.',
    birth: 'After the Qin empire unified the script, faster clerical, running and cursive hands grew out of daily brush use. In the Jin dynasty Wang Xizhi turned writing into expressive art, and his style became the model for 1,600 years.',
  },
  roman: {
    born: 'c. 500 BCE Republic · peak under Augustus (27 BCE) and Trajan (98–117 CE)',
    pioneers: [
      { name: 'Vitruvius', note: 'De architectura (c. 30–15 BCE), the only surviving architectural treatise of antiquity' },
      { name: 'Apollodorus of Damascus', note: 'Trajan’s Forum and Column (113 CE)' },
      { name: 'Hadrian’s builders', note: 'The Pantheon (c. 125 CE), still the largest unreinforced concrete dome' },
    ],
    why: 'Rome needed to govern a vast empire. Art and architecture were propaganda and infrastructure: they celebrated victories, recorded real faces and built public life.',
    birth: 'Romans took Greek forms and Etruscan engineering, then invented concrete and mastered the arch and vault. Families kept wax masks of their ancestors, which grew into brutally honest portrait busts.',
  },
  'indian-classical': {
    born: 'c. 320–550 CE · Gupta period, “golden age” of Indian art',
    pioneers: [
      { name: 'Gupta-era sculptors of Sarnath and Mathura', note: 'Created the serene seated Buddha that spread across Asia' },
      { name: 'Painters of the Ajanta caves', note: 'Murals of the 5th century under the Vakataka dynasty' },
    ],
    why: 'Hindu, Buddhist and Jain devotion needed images that worshippers could meet face to face (darshan). Beauty was a path to the divine, governed by the rules of the shilpa shastras.',
    birth: 'Building on Mauryan and Kushan sculpture, Gupta artisans settled on ideal proportions, calm inward faces and flowing drapery. Temples became cosmic diagrams in stone, and cave monasteries were painted wall to wall.',
  },
  byzantine: {
    born: '330 CE · Constantine founds Constantinople · Hagia Sophia completed 537',
    pioneers: [
      { name: 'Anthemius of Tralles & Isidore of Miletus', note: 'Designed Hagia Sophia for Emperor Justinian' },
      { name: 'Mosaicists of Ravenna', note: 'San Vitale (547) — Justinian and Theodora in gold' },
      { name: 'Andrei Rublev', note: 'c. 1360–1430; the Trinity icon, summit of the tradition in Russia' },
    ],
    why: 'The Christian Roman Empire wanted images that showed heaven, not earth. Gold, flatness and frontal faces turned church walls into windows onto eternity.',
    birth: 'When the capital moved to Constantinople, late Roman mosaic techniques were redirected to Christian themes. Glass tesserae backed with gold leaf made interiors glow, and icon painting followed strict rules so every image stayed true to its model.',
  },
  medieval: {
    born: 'c. 500–1150 · Early Medieval and Romanesque Europe',
    pioneers: [
      { name: 'Monastic scriptoria', note: 'Illuminated manuscripts copied and painted by monks and nuns' },
      { name: 'Gislebertus', note: 'Sculptor of the Last Judgement tympanum at Autun, c. 1130 — one of few who signed' },
      { name: 'Makers of the Bayeux Tapestry', note: 'c. 1070, embroidered narrative nearly 70 m long' },
    ],
    why: 'Most people could not read. Churches needed to teach the Bible and warn of Judgement through pictures, while monasteries preserved learning in books.',
    birth: 'After Rome’s collapse, monasteries became the centres of art. Pilgrimage routes around 1000 sparked Romanesque churches with thick walls, round arches, carved portals and painted interiors.',
  },
  'chinese-ink': {
    born: '8th century · Tang dynasty monochrome landscape',
    pioneers: [
      { name: 'Wang Wei', note: '699–759; poet-painter traditionally credited with monochrome ink landscape' },
      { name: 'Jing Hao', note: 'c. 855–915; wrote the first theory of landscape brushwork' },
      { name: 'Fan Kuan & Guo Xi', note: 'Northern Song masters of monumental landscape, 11th century' },
    ],
    why: 'Scholars retreating from court life sought harmony with nature. A landscape in ink was a meditation and a portrait of the painter’s mind rather than a record of a place.',
    birth: 'Tang painters dropped colour and let ink wash, dry brush and empty silk suggest mist and distance. Northern Song masters built towering mountains from texture strokes and codified how to paint rock, tree and water.',
  },
  'southeast-asian': {
    born: 'c. 8th–12th century · Borobudur (c. 800) and Angkor Wat (c. 1150)',
    pioneers: [
      { name: 'Sailendra dynasty builders', note: 'Borobudur, Java — the world’s largest Buddhist monument' },
      { name: 'Suryavarman II', note: 'Khmer king who commissioned Angkor Wat' },
      { name: 'Javanese batik makers', note: 'Wax-resist textile art, refined in the courts of Java' },
    ],
    why: 'Kings ruled as representatives of gods and the Buddha. Temples modelled the sacred Mount Meru so that the kingdom itself sat at the centre of the universe.',
    birth: 'Indian religious ideas arrived by sea trade and blended with local traditions. Stone temples carried miles of narrative relief, while wax-resist dyeing grew into the intricate batik patterns of court and village.',
  },
  'islamic-geometric': {
    born: '691–692 CE · Dome of the Rock, Jerusalem',
    pioneers: [
      { name: 'Caliph Abd al-Malik', note: 'Commissioned the Dome of the Rock' },
      { name: 'Abu al-Wafa’ al-Buzjani', note: '940–998; wrote a geometry manual for craftsmen' },
      { name: 'Timurid master builders', note: 'Girih tile patterns, e.g. the Darb-i Imam shrine, Isfahan (1453)' },
    ],
    why: 'Religious spaces avoided images of living beings. Geometry, pattern and calligraphy became the way to express the infinite order of creation.',
    birth: 'Early Islamic builders inherited Roman and Persian ornament and made it abstract. Mathematicians and artisans worked together, and by the 15th century girih tiles produced patterns of astonishing complexity.',
  },
  korean: {
    born: '918 · Goryeo dynasty (celadon) · Joseon painting from 1392',
    pioneers: [
      { name: 'Goryeo potters', note: 'Jade-green celadon with inlaid (sanggam) decoration, 12th century' },
      { name: 'An Gyeon', note: 'Dream Journey to the Peach Blossom Land, 1447' },
      { name: 'Jeong Seon', note: '1676–1759; founded “true-view” landscape of real Korean places' },
    ],
    why: 'Korean art pursued restraint, naturalness and harmony with the land — shaped by Buddhism under Goryeo and Confucian ideals under Joseon.',
    birth: 'Goryeo kilns developed a unique inlay technique for celadon. Under Joseon, painters absorbed Chinese models, then in the 18th century turned to Korea’s own mountains and everyday life.',
  },
  japanese: {
    born: '794 · Heian period, the birth of yamato-e',
    pioneers: [
      { name: 'Heian court painters', note: 'Tale of Genji handscrolls, 12th century' },
      { name: 'Kanō Masanobu', note: '1434–1530; founded the Kanō school' },
      { name: 'Tawaraya Sōtatsu & Ogata Kōrin', note: 'Rinpa school, 17th–18th century' },
    ],
    why: 'After a period of copying Tang China, the Heian court wanted a Japanese way of seeing: native seasons, poetry and the emotions of court life.',
    birth: 'Painters developed yamato-e with flat colour, blown-off roofs to look inside rooms, and scrolls that unfold in time. Later schools turned gold screens and nature into bold decorative design.',
  },
  zen: {
    born: '13th century · Chan painting in Song China, carried to Japan',
    pioneers: [
      { name: 'Mu Qi & Liang Kai', note: 'Chinese Chan monk-painters of the 13th century' },
      { name: 'Sesshū Tōyō', note: '1420–1506; Japanese monk-painter' },
      { name: 'Hakuin Ekaku', note: '1686–1769; ensō circles and teaching images' },
    ],
    why: 'Zen teaches direct experience and sudden insight. A painting made in a few strokes, without correction, shows the painter’s mind in the moment.',
    birth: 'Chan monks in China painted with spontaneous ink. Japanese monks studying there brought these works home, and temples developed ensō, dry gardens and tea aesthetics.',
  },
  'sumi-e': {
    born: '14th–15th century · Muromachi Japan',
    pioneers: [
      { name: 'Josetsu', note: 'Catfish and Gourd (c. 1413), early Japanese ink painting' },
      { name: 'Tenshō Shūbun', note: 'Monk-painter of the Shōkoku-ji temple' },
      { name: 'Sesshū Tōyō', note: 'Splashed-ink landscape (1495)' },
    ],
    why: 'Ink painting was a discipline of mind and hand. With only black ink the painter had to capture the spirit of bamboo, plum or mountain rather than its surface.',
    birth: 'Zen temples imported Chinese ink landscapes. Their monk-painters studied them and developed a Japanese style of fewer strokes, more emptiness and bold splashed ink.',
  },
  gothic: {
    born: '1140–1144 · choir of the Abbey of Saint-Denis, near Paris',
    pioneers: [
      { name: 'Abbot Suger', note: 'Rebuilt Saint-Denis to fill it with coloured light' },
      { name: 'Master masons of Chartres & Reims', note: 'Chartres Cathedral (1194–1220)' },
      { name: 'Pierre de Montreuil', note: 'Rayonnant Gothic in Paris, 13th century' },
    ],
    why: 'Theologians believed light was a manifestation of God. Growing cities also competed to build ever taller cathedrals as signs of faith and civic pride.',
    birth: 'Suger combined pointed arches, rib vaults and later flying buttresses, which let walls become screens of stained glass. The style spread from the Île-de-France across Europe.',
  },
  tibetan: {
    born: 'c. 11th century · second spread of Buddhism in Tibet',
    pioneers: [
      { name: 'Atiśa & Rinchen Zangpo', note: 'Their teaching (from 1042) sparked monasteries and painting workshops' },
      { name: 'Menla Döndrub', note: '15th century; founded the Menri school of thangka painting' },
      { name: 'Namkha Tashi', note: '16th century; founded the Karma Gadri school' },
    ],
    why: 'Vajrayana Buddhism uses images as tools for meditation. A mandala or deity must be painted with exact proportions so the practitioner can visualise it.',
    birth: 'Tibet absorbed Indian, Nepalese and Chinese styles as Buddhism returned in the 11th century. Monks and lay painters followed measurement grids, making thangka scrolls and sand mandalas that are destroyed after use.',
  },
  'persian-miniature': {
    born: 'c. 1250–1300 · Ilkhanid (Mongol) Iran',
    pioneers: [
      { name: 'Rashid al-Din’s workshop', note: 'Illustrated the Jami al-Tawarikh (c. 1307) in Tabriz' },
      { name: 'Kamāl ud-Dīn Behzād', note: 'c. 1450–1535; master of Herat' },
      { name: 'Sultan Muhammad', note: 'The Shahnameh of Shah Tahmasp (1520s–30s)' },
    ],
    why: 'Rulers loved poetry and history. Illustrating the great books — the Shahnameh, Nizami’s poems — displayed learning and royal taste.',
    birth: 'Mongol rule brought Chinese scroll painting to Iran. Persian artists merged it with their own traditions into jewel-like pages of high horizons, patterned carpets and tiny figures in gardens.',
  },
  renaissance: {
    born: '1401 · Florence Baptistery doors competition · c. 1415 Brunelleschi’s perspective',
    pioneers: [
      { name: 'Filippo Brunelleschi', note: 'Demonstrated linear perspective c. 1415; dome of Florence Cathedral' },
      { name: 'Masaccio', note: 'Holy Trinity (c. 1427), the first painting in rigorous perspective' },
      { name: 'Leon Battista Alberti', note: 'De pictura (1435), the theory of the new painting' },
      { name: 'Donatello & Lorenzo Ghiberti', note: 'Revived classical sculpture' },
    ],
    why: 'Wealthy merchant cities, humanist scholars and rediscovered ancient texts put humanity back at the centre. Patrons like the Medici wanted art as rational and dignified as antiquity.',
    birth: 'In Florence, artists studied Roman ruins and mathematics. Brunelleschi showed how to construct perspective with a mirror and a vanishing point, and painters, sculptors and architects adopted it within a generation.',
  },
  'west-african': {
    born: 'c. 12th century · Ife, Nigeria · Benin bronzes 15th–17th century',
    pioneers: [
      { name: 'Ife bronze and terracotta casters', note: 'Naturalistic royal heads, 12th–15th century' },
      { name: 'Igun Eronmwon guild of Benin', note: 'Royal brass casters of the Oba' },
      { name: 'Oba Esigie', note: 'Early 16th-century king whose reign saw the famous plaques' },
    ],
    why: 'Kingdoms needed to honour sacred kings and ancestors and to record court history. Only guilds serving the king could cast brass, so the art was a royal archive.',
    birth: 'Ife artists mastered lost-wax casting to produce serene portrait heads. The technique passed to Benin, where guilds cast hundreds of plaques that covered the palace pillars.',
  },
  mannerism: {
    born: 'c. 1520 · after the death of Raphael',
    pioneers: [
      { name: 'Jacopo Pontormo & Rosso Fiorentino', note: 'Florentine painters of the 1520s' },
      { name: 'Parmigianino', note: 'Madonna with the Long Neck (1535–40)' },
      { name: 'Giorgio Vasari', note: 'Wrote of the “maniera”, the stylish manner' },
    ],
    why: 'The High Renaissance had seemingly solved painting. Younger artists — living through the Sack of Rome (1527) and the Reformation — turned to elegance, tension and artifice instead.',
    birth: 'Following Michelangelo’s late work, painters stretched bodies, crowded compositions and chose acid colours, prizing difficulty and invention over natural balance.',
  },
  mughal: {
    born: '1549–1555 · atelier founded by Emperor Humayun',
    pioneers: [
      { name: 'Mir Sayyid Ali & Abd al-Samad', note: 'Persian masters who established the imperial studio' },
      { name: 'Emperor Akbar', note: 'Commissioned the Hamzanama (c. 1562–77)' },
      { name: 'Basawan, Daswanth, Mansur, Abu’l Hasan', note: 'Leading court painters' },
    ],
    why: 'The Mughal emperors were passionate patrons who wanted to record their reigns, their science and their world in painting, blending Persian refinement with Indian vitality.',
    birth: 'Humayun brought Persian painters back from exile. Under Akbar, hundreds of Indian artists joined the studio, and European prints added perspective and shading.',
  },
  baroque: {
    born: 'c. 1600 · Caravaggio’s Contarelli Chapel canvases in Rome (1599–1600)',
    pioneers: [
      { name: 'Caravaggio', note: 'Dramatic chiaroscuro and real people as saints' },
      { name: 'Annibale Carracci', note: 'Farnese Gallery ceiling (1597–1601)' },
      { name: 'Gian Lorenzo Bernini', note: 'Ecstasy of St Teresa (1647–52), St Peter’s colonnade' },
      { name: 'Peter Paul Rubens', note: 'Carried the style north' },
    ],
    why: 'After the Council of Trent (1545–63) the Catholic Church wanted art that stirred emotion and won back believers. Absolutist kings wanted grandeur that overwhelmed.',
    birth: 'Caravaggio lit ordinary models with raking light against darkness. Sculptors and architects made spaces that seem to move, uniting painting, sculpture and building into theatre.',
  },
  'ukiyo-e': {
    born: 'c. 1670s · first single-sheet woodblock prints in Edo',
    pioneers: [
      { name: 'Hishikawa Moronobu', note: 'c. 1618–1694; first great ukiyo-e print designer' },
      { name: 'Suzuki Harunobu', note: 'Full-colour “brocade” prints (nishiki-e), 1765' },
      { name: 'Katsushika Hokusai & Utagawa Hiroshige', note: 'The Great Wave (c. 1831), Fifty-three Stations' },
    ],
    why: 'The merchant class of Edo had money but no political power. They spent it on theatre, fashion and pleasure — the “floating world” — and wanted cheap images of it.',
    birth: 'Publishers organised a team of designer, woodcarver and printer. Black-line book illustrations became single sheets, then multi-block colour prints that anyone could afford.',
  },
  rococo: {
    born: 'c. 1715–1730 · Paris, after the death of Louis XIV',
    pioneers: [
      { name: 'Antoine Watteau', note: 'Pilgrimage to Cythera (1717), founder of the fête galante' },
      { name: 'Nicolas Pineau & Juste-Aurèle Meissonnier', note: 'Designers of rocaille ornament' },
      { name: 'François Boucher & Jean-Honoré Fragonard', note: 'The Swing (1767)' },
    ],
    why: 'After Louis XIV’s solemn court, the aristocracy moved into intimate Paris salons and wanted art for pleasure, love and conversation rather than state glory.',
    birth: 'Decorators replaced heavy Baroque forms with asymmetric shell-like curves (rocaille), pastel colours and mirrors. Watteau’s dreamy garden parties set the tone for painting.',
  },
  neoclassicism: {
    born: '1755 · Winckelmann’s “noble simplicity and quiet grandeur” · 1784 David’s Oath of the Horatii',
    pioneers: [
      { name: 'Johann Joachim Winckelmann', note: 'Theorist who urged artists to imitate the Greeks' },
      { name: 'Jacques-Louis David', note: 'Oath of the Horatii (1784)' },
      { name: 'Antonio Canova', note: 'Sculptor, Psyche Revived by Cupid’s Kiss (1787–93)' },
    ],
    why: 'Enlightenment thinkers rejected Rococo frivolity as decadent. Excavations at Herculaneum (1738) and Pompeii (1748) revealed antiquity, which offered models of virtue for revolutions and new republics.',
    birth: 'Artists in Rome studied ancient ruins and plaster casts. David’s austere compositions of duty and sacrifice made classical style the language of the French Revolution and later of Napoleon.',
  },
  romanticism: {
    born: 'c. 1800 · in reaction to Enlightenment reason and the Industrial Revolution',
    pioneers: [
      { name: 'Francisco Goya', note: 'The Third of May 1808 (1814)' },
      { name: 'Caspar David Friedrich', note: 'Wanderer above the Sea of Fog (c. 1818)' },
      { name: 'J. M. W. Turner & John Constable', note: 'Light, storm and landscape' },
      { name: 'Théodore Géricault & Eugène Delacroix', note: 'Raft of the Medusa (1819), Liberty Leading the People (1830)' },
    ],
    why: 'Revolution, war and factories shook faith in order. Artists turned to emotion, imagination, nature’s power and national identity — the sublime that reason could not contain.',
    birth: 'Writers such as the Schlegel brothers named the Romantic spirit. Painters answered with storms, ruins, lone figures and political drama, painted with loose, passionate brushwork.',
  },
  realism: {
    born: '1849–1855 · Courbet’s Stone Breakers and his Pavilion of Realism',
    pioneers: [
      { name: 'Gustave Courbet', note: 'A Burial at Ornans (1849–50); “Show me an angel and I’ll paint one”' },
      { name: 'Jean-François Millet', note: 'The Gleaners (1857)' },
      { name: 'Honoré Daumier', note: 'Caricature and The Third-Class Carriage' },
    ],
    why: 'After the revolutions of 1848, artists felt that the heroic and the ideal were lies. Ordinary workers, peasants and everyday life deserved the scale once reserved for kings.',
    birth: 'Courbet painted labourers and a village funeral on huge canvases. When the 1855 Exposition rejected him, he built his own pavilion and published a Realist manifesto.',
  },
  impressionism: {
    born: '1874 · first independent exhibition in Nadar’s former studio, Paris',
    pioneers: [
      { name: 'Claude Monet', note: 'Impression, Sunrise (1872) gave the movement its name' },
      { name: 'Pierre-Auguste Renoir, Camille Pissarro, Alfred Sisley', note: 'Plein-air painters' },
      { name: 'Edgar Degas & Berthe Morisot', note: 'Modern Parisian life' },
    ],
    why: 'Photography took over exact depiction, and the official Salon refused new work. Painters wanted to capture fleeting light and modern life as the eye actually perceives it.',
    birth: 'Portable paint tubes (patented 1841) let artists work outdoors. Rejected by the Salon, they exhibited independently, and the critic Louis Leroy mocked Monet’s painting as a mere “impression”.',
  },
  symbolism: {
    born: '1886 · Jean Moréas publishes the Symbolist Manifesto in Le Figaro',
    pioneers: [
      { name: 'Gustave Moreau', note: 'Jewelled mythological visions' },
      { name: 'Odilon Redon', note: 'Charcoal “noirs” and dream images' },
      { name: 'Pierre Puvis de Chavannes & Fernand Khnopff', note: 'Silent, allegorical worlds' },
    ],
    why: 'Against Realism and Impressionism’s surfaces, poets and painters wanted to express ideas, dreams, death and desire — truths that could only be suggested, never shown directly.',
    birth: 'Growing from Baudelaire’s and Mallarmé’s poetry, the Symbolists used myth, mystery and strange colour to hint at hidden meanings behind visible things.',
  },
  'post-impressionism': {
    born: '1886 · final Impressionist exhibition (Seurat’s La Grande Jatte) · named by Roger Fry in 1910',
    pioneers: [
      { name: 'Paul Cézanne', note: 'Structure and geometry in nature' },
      { name: 'Vincent van Gogh', note: 'The Starry Night (1889)' },
      { name: 'Paul Gauguin', note: 'Symbolic colour, Tahiti' },
      { name: 'Georges Seurat', note: 'Pointillism' },
    ],
    why: 'Impressionism captured light but, for some, lost solidity and meaning. These painters wanted to add structure, emotion and symbolism while keeping bright colour.',
    birth: 'Each took Impressionism in a different direction: Seurat into scientific dots, Cézanne into geometry, Van Gogh into expressive strokes and Gauguin into flat symbolic colour. Roger Fry grouped them for a London exhibition in 1910.',
  },
  'art-nouveau': {
    born: '1893 · Victor Horta’s Hôtel Tassel, Brussels · named after Siegfried Bing’s Paris shop (1895)',
    pioneers: [
      { name: 'Victor Horta', note: 'Hôtel Tassel (1893)' },
      { name: 'Alphonse Mucha', note: 'Gismonda poster (1894)' },
      { name: 'Hector Guimard', note: 'Paris Métro entrances (1900)' },
      { name: 'Antoni Gaudí & Gustav Klimt', note: 'Barcelona and the Vienna Secession' },
    ],
    why: 'Designers rejected the copying of historic styles and cheap factory ornament. They wanted a new, total art of daily life inspired by nature.',
    birth: 'Following the Arts and Crafts movement and Japanese prints, architects and designers used iron, glass and the whiplash curve of plants across buildings, posters, furniture and jewellery.',
  },
  fauvism: {
    born: '1905 · Salon d’Automne, Paris — critic Louis Vauxcelles calls the painters “fauves” (wild beasts)',
    pioneers: [
      { name: 'Henri Matisse', note: 'Woman with a Hat (1905)' },
      { name: 'André Derain', note: 'Painted Collioure with Matisse in summer 1905' },
      { name: 'Maurice de Vlaminck', note: 'Raw, straight-from-the-tube colour' },
    ],
    why: 'Painters wanted colour to express feeling rather than describe objects. Freed by Van Gogh and Gauguin, they asked: why must a face be flesh-coloured?',
    birth: 'Working together in Collioure in 1905, Matisse and Derain applied pure, unmixed colour in bold patches. Their Salon room caused a scandal, and the insult became their name.',
  },
  expressionism: {
    born: '7 June 1905 · Die Brücke founded in Dresden',
    pioneers: [
      { name: 'Ernst Ludwig Kirchner, Erich Heckel, Karl Schmidt-Rottluff, Fritz Bleyl', note: 'Founders of Die Brücke' },
      { name: 'Wassily Kandinsky & Franz Marc', note: 'Founded Der Blaue Reiter, Munich, 1911' },
      { name: 'Edvard Munch', note: 'The Scream (1893), key precursor' },
    ],
    why: 'Rapid industrialisation and city life produced anxiety and alienation. Artists wanted to show inner emotional reality rather than outward appearance.',
    birth: 'Four architecture students in Dresden formed Die Brücke (“The Bridge”) to reach a new art. They used distorted forms, harsh colour and revived the woodcut for its raw, jagged power.',
  },
  cubism: {
    born: '1907–1908 · Picasso’s Les Demoiselles d’Avignon · Braque’s L’Estaque landscapes',
    pioneers: [
      { name: 'Pablo Picasso', note: 'Les Demoiselles d’Avignon (1907)' },
      { name: 'Georges Braque', note: 'Houses at L’Estaque (1908) — Vauxcelles saw “little cubes”' },
      { name: 'Juan Gris', note: 'Synthetic Cubism' },
    ],
    why: 'Perspective showed the world from one fixed point. Inspired by Cézanne and by African and Iberian sculpture, Picasso and Braque wanted to show how we actually know objects — from many sides at once.',
    birth: 'Working side by side in Paris, they broke forms into facets and reassembled them on a flat surface. From 1912 they invented collage by pasting newspaper and wallpaper into paintings.',
  },
  futurism: {
    born: '20 February 1909 · Marinetti’s Futurist Manifesto on the front page of Le Figaro',
    pioneers: [
      { name: 'Filippo Tommaso Marinetti', note: 'Poet and founder' },
      { name: 'Umberto Boccioni', note: 'Unique Forms of Continuity in Space (1913)' },
      { name: 'Giacomo Balla, Carlo Carrà, Luigi Russolo, Gino Severini', note: 'Signed the 1910 painters’ manifesto' },
    ],
    why: 'Italy felt trapped by its past. The Futurists celebrated speed, machines, the city and violence, and wanted to destroy museums and tradition.',
    birth: 'Marinetti published a manifesto before any Futurist art existed. Painters then combined Cubist fragmentation with repeated forms from photography to show motion and energy.',
  },
  constructivism: {
    born: '1913–1914 · Vladimir Tatlin’s counter-reliefs · named in 1921',
    pioneers: [
      { name: 'Vladimir Tatlin', note: 'Counter-reliefs; Monument to the Third International (1919–20)' },
      { name: 'Alexander Rodchenko & Varvara Stepanova', note: 'First Working Group of Constructivists (1921)' },
      { name: 'El Lissitzky', note: 'Beat the Whites with the Red Wedge (1919)' },
    ],
    why: 'After the Russian Revolution, artists believed art should serve society, not decorate it. They became engineers of a new world of posters, buildings, textiles and books.',
    birth: 'After visiting Picasso’s studio, Tatlin built abstract reliefs from real metal, wood and glass. After 1917, artists rejected easel painting for design and propaganda built from industrial materials.',
  },
  suprematism: {
    born: 'December 1915 · “0,10” exhibition in Petrograd — Malevich’s Black Square',
    pioneers: [
      { name: 'Kazimir Malevich', note: 'Black Square; manifesto From Cubism and Futurism to Suprematism' },
      { name: 'Lyubov Popova & Olga Rozanova', note: 'Developed the style' },
      { name: 'El Lissitzky', note: 'Prouns, bridging to architecture' },
    ],
    why: 'Malevich wanted to free art completely from depicting objects and reach the “supremacy of pure feeling” — a zero point from which a new art could begin.',
    birth: 'Malevich hung a black square in the icon corner of the exhibition room, where a sacred image would normally hang. Floating coloured geometric forms on white followed.',
  },
  dada: {
    born: '5 February 1916 · Cabaret Voltaire opens in Zurich',
    pioneers: [
      { name: 'Hugo Ball & Emmy Hennings', note: 'Founded the Cabaret Voltaire' },
      { name: 'Tristan Tzara, Jean Arp, Marcel Janco, Richard Huelsenbeck, Sophie Taeuber-Arp', note: 'Zurich Dada' },
      { name: 'Marcel Duchamp', note: 'Fountain (1917), the readymade' },
    ],
    why: 'World War I showed that “rational” civilisation could produce mass slaughter. Dada answered with absurdity, chance and anti-art to mock the values that led to war.',
    birth: 'Artists who had fled to neutral Switzerland staged nonsense poetry, noise and masks at the Cabaret Voltaire. Dada spread to Berlin, Paris and New York, where Duchamp exhibited a urinal as art.',
  },
  'de-stijl': {
    born: '1917 · Theo van Doesburg founds the journal De Stijl in Leiden',
    pioneers: [
      { name: 'Theo van Doesburg', note: 'Founder, editor and theorist' },
      { name: 'Piet Mondrian', note: 'Neoplasticism: grids and primary colours' },
      { name: 'Gerrit Rietveld', note: 'Red and Blue Chair (1918), Schröder House (1924)' },
    ],
    why: 'In a Europe torn by war, these Dutch artists sought universal harmony and order that could be shared by everyone and used to redesign all of life.',
    birth: 'The group reduced art to its essentials: straight horizontal and vertical lines, the three primaries plus black, white and grey. They then applied this to furniture, architecture and typography.',
  },
  bauhaus: {
    born: '1919 · Walter Gropius founds the Staatliches Bauhaus in Weimar',
    pioneers: [
      { name: 'Walter Gropius', note: 'Founder and first director' },
      { name: 'Johannes Itten, Paul Klee, Wassily Kandinsky', note: 'Masters of form' },
      { name: 'László Moholy-Nagy, Josef & Anni Albers, Marianne Brandt', note: 'Workshops of the new design' },
    ],
    why: 'Germany needed to rebuild after World War I. Gropius wanted to unite art, craft and industry to design good, affordable things for modern life.',
    birth: 'Gropius merged an art academy and a crafts school. Students took a preliminary course and trained in workshops; the school moved to Dessau in 1925 and was closed under Nazi pressure in 1933.',
  },
  surrealism: {
    born: 'October 1924 · André Breton’s Manifesto of Surrealism',
    pioneers: [
      { name: 'André Breton', note: 'Founder and theorist' },
      { name: 'Max Ernst, Joan Miró, René Magritte, Yves Tanguy', note: 'Early members' },
      { name: 'Salvador Dalí', note: 'Joined in 1929 — The Persistence of Memory (1931)' },
      { name: 'Leonora Carrington & Dorothea Tanning', note: 'Extended its reach' },
    ],
    why: 'Inspired by Freud, the Surrealists believed that the unconscious, dreams and desire were truer than logic. Art could free the mind that war and bourgeois reason had caged.',
    birth: 'Growing out of Paris Dada, Breton and Philippe Soupault experimented with automatic writing (1919). Painters adapted it through automatic drawing, frottage and meticulously painted dream images.',
  },
  'abstract-expressionism': {
    born: '1943 · Jackson Pollock’s Mural for Peggy Guggenheim, New York',
    pioneers: [
      { name: 'Jackson Pollock & Lee Krasner', note: 'Drip and all-over painting' },
      { name: 'Willem de Kooning & Franz Kline', note: 'Gestural “action painting”' },
      { name: 'Mark Rothko & Barnett Newman', note: 'Colour-field painting' },
      { name: 'Arshile Gorky', note: 'Bridge from Surrealism' },
    ],
    why: 'After World War II and the atomic bomb, figurative art seemed inadequate. Painters sought a universal, emotional language, and New York wanted an art of its own.',
    birth: 'Exiled Surrealists in New York introduced automatism to young American painters. Laying canvases on the floor or painting huge fields of colour, they made the act of painting itself the subject.',
  },
  'op-art': {
    born: '1955 · “Le Mouvement” exhibition, Galerie Denise René, Paris',
    pioneers: [
      { name: 'Victor Vasarely', note: 'Zebras (1937), father of Op Art' },
      { name: 'Bridget Riley', note: 'Movement in Squares (1961)' },
      { name: 'Jesús Rafael Soto & Carlos Cruz-Diez', note: 'Kinetic and colour works' },
    ],
    why: 'Artists wanted art that needed no story or symbol — pure perception. Using science and geometry, a painting could make the viewer’s own eye produce movement.',
    birth: 'Building on Bauhaus colour studies, painters used precise patterns and contrasts to create vibration and illusion. MoMA’s 1965 exhibition “The Responsive Eye” made it a worldwide craze.',
  },
  'pop-art': {
    born: '1956 · Richard Hamilton’s collage “Just what is it…?” at This Is Tomorrow, London',
    pioneers: [
      { name: 'Eduardo Paolozzi & Richard Hamilton', note: 'Independent Group, London' },
      { name: 'Andy Warhol', note: 'Campbell’s Soup Cans (1962)' },
      { name: 'Roy Lichtenstein & Claes Oldenburg', note: 'Comics and giant everyday objects' },
    ],
    why: 'Post-war consumer culture, advertising, television and celebrity were transforming everyday life. Artists wanted to reflect this — reacting against Abstract Expressionism’s seriousness.',
    birth: 'London’s Independent Group collaged magazine ads in the early 1950s. In the early 1960s American artists used silkscreens and commercial techniques to put soup cans, comics and stars in galleries.',
  },
  minimalism: {
    born: '1959 · Frank Stella’s Black Paintings · named in 1965',
    pioneers: [
      { name: 'Frank Stella', note: 'Black Paintings (1959)' },
      { name: 'Donald Judd', note: 'Essay “Specific Objects” (1965)' },
      { name: 'Carl Andre, Dan Flavin, Sol LeWitt, Agnes Martin', note: 'Floor pieces, fluorescent light, modules, grids' },
    ],
    why: 'Artists wanted to strip away emotion, illusion and the artist’s hand. Art should be what it is — real objects in real space — with the viewer’s experience as the subject.',
    birth: 'Stella painted stripes that simply repeated the canvas shape. Sculptors then used industrial materials and simple repeated forms, often fabricated by factories. Critic Richard Wollheim coined the term “Minimal Art” in 1965.',
  },
  algorithmic: {
    born: 'February 1965 · Georg Nees shows computer graphics in Stuttgart',
    pioneers: [
      { name: 'Georg Nees & Frieder Nake', note: 'First computer art exhibitions in Stuttgart, 1965' },
      { name: 'A. Michael Noll', note: 'Bell Labs; Howard Wise Gallery, New York, April 1965' },
      { name: 'Vera Molnar & Manfred Mohr', note: 'Pioneers of plotter art' },
    ],
    why: 'Mainframes were built for science, but a few researchers wondered if a machine could make art. An algorithm could explore rules and randomness no hand could.',
    birth: 'Mathematicians wrote programs and drew the output with pen plotters such as the Zuse Graphomat. Art critics were outraged; Vera Molnar had already been working with her “imaginary machine” since 1959.',
  },
  conceptual: {
    born: '1965–1967 · Kosuth’s One and Three Chairs · LeWitt’s “Paragraphs on Conceptual Art”',
    pioneers: [
      { name: 'Sol LeWitt', note: '“The idea becomes a machine that makes the art” (1967)' },
      { name: 'Joseph Kosuth', note: 'One and Three Chairs (1965)' },
      { name: 'Lawrence Weiner, Yoko Ono, On Kawara', note: 'Instructions, statements and dates' },
      { name: 'Marcel Duchamp', note: 'Readymades — key precursor' },
    ],
    why: 'Artists rejected the art market’s obsession with objects and craft. The idea itself, not a beautiful thing, would be the work.',
    birth: 'Building on Duchamp and Fluxus, artists produced texts, instructions, photographs and documents. Henry Flynt had coined “concept art” in 1961.',
  },
  'ascii-art': {
    born: '1966 · Knowlton & Harmon’s “Studies in Perception I” at Bell Labs',
    pioneers: [
      { name: 'Kenneth Knowlton & Leon Harmon', note: 'A nude image built from printed symbols' },
      { name: 'Flora Stacey', note: 'Typewriter butterfly (1898), early precursor' },
      { name: 'BBS and demoscene artists', note: '1980s–90s text art on screens' },
    ],
    why: 'Early printers and terminals could only produce characters. Artists and engineers discovered that letters, arranged by density, could draw images.',
    birth: 'The ASCII standard (1963) made a shared set of characters. Bell Labs researchers scanned photos and replaced grey values with symbols; later, teletype users and bulletin boards turned it into a folk art.',
  },
  'land-art': {
    born: '1967 · Richard Long’s A Line Made by Walking · “Earthworks” show, Dwan Gallery 1968',
    pioneers: [
      { name: 'Robert Smithson', note: 'Spiral Jetty (1970), Great Salt Lake' },
      { name: 'Michael Heizer', note: 'Double Negative (1969)' },
      { name: 'Nancy Holt & Walter De Maria', note: 'Sun Tunnels (1976), The Lightning Field (1977)' },
      { name: 'Richard Long', note: 'Walking as sculpture' },
    ],
    why: 'Artists wanted to escape the gallery and the art market and engage with landscape, time and ecology — works that could not be bought or moved.',
    birth: 'Artists took bulldozers to the desert or simply walked. The work often exists only in remote sites, photographs and maps, and some is slowly reclaimed by nature.',
  },
  installation: {
    born: 'c. 1958 Allan Kaprow’s “environments” · the term established in the 1970s',
    pioneers: [
      { name: 'Kurt Schwitters', note: 'Merzbau (1923–37), early precursor' },
      { name: 'Allan Kaprow', note: 'Environments and Happenings' },
      { name: 'Yayoi Kusama', note: 'Infinity Mirror Room (1965)' },
      { name: 'Ilya Kabakov', note: '“Total installation”' },
    ],
    why: 'Artists wanted the viewer inside the work, not in front of it. The whole room — space, light, sound, time — could be the medium.',
    birth: 'From Schwitters’ grotto of found objects to Kaprow’s Happenings, artists gradually took over entire spaces. By the 1970s museums began commissioning site-specific installations.',
  },
  postmodern: {
    born: '1966 Venturi’s Complexity and Contradiction · 1977 “Pictures” exhibition · 1979 Lyotard',
    pioneers: [
      { name: 'Robert Venturi & Denise Scott Brown', note: '“Less is a bore”' },
      { name: 'Cindy Sherman, Barbara Kruger, Sherrie Levine', note: 'The Pictures Generation' },
      { name: 'Jean-François Lyotard', note: 'The Postmodern Condition (1979)' },
    ],
    why: 'The modernist belief in progress and a single truth collapsed. Artists questioned originality, authority and grand narratives through irony, quotation and pastiche.',
    birth: 'Architects returned to ornament and historic references. Artists appropriated images from media and art history, and theorists described a world of copies without originals.',
  },
  graffiti: {
    born: '1967 · Cornbread writes his name across Philadelphia · 1971 TAKI 183 in The New York Times',
    pioneers: [
      { name: 'Cornbread (Darryl McCray)', note: 'Considered the first modern graffiti writer' },
      { name: 'TAKI 183', note: 'Made tagging a New York phenomenon' },
      { name: 'Phase 2, Tracy 168, Lee Quiñones', note: 'Bubble letters, wildstyle, whole-car murals' },
    ],
    why: 'Young people in neglected neighbourhoods had no voice in the city. Writing your name everywhere — especially on moving trains — was fame, identity and territory.',
    birth: 'Teenagers used spray paint and markers to tag. Competition for style drove tags to become complex pieces, and graffiti became one of the four elements of hip-hop culture.',
  },
  'pixel-art': {
    born: '1972 · Pong and Richard Shoup’s SuperPaint · term coined 1982',
    pioneers: [
      { name: 'Richard Shoup', note: 'SuperPaint (1972–73), Xerox PARC; coined “pixel art” with Adele Goldberg in 1982' },
      { name: 'Tomohiro Nishikado', note: 'Space Invaders (1978)' },
      { name: 'Susan Kare & Shigeru Miyamoto', note: 'Macintosh icons (1984), Super Mario Bros. (1985)' },
    ],
    why: 'Early computers had tiny memory and low resolution. Every pixel had to be placed by hand, so artists learned to suggest a character in a few squares.',
    birth: 'Video games and paint programs forced designers to work on a grid with limited colours. Constraint became style, and later artists chose it deliberately out of nostalgia and clarity.',
  },
  'dither-art': {
    born: '1973 · Bryce Bayer’s ordered dither matrix · 1976 Floyd–Steinberg error diffusion',
    pioneers: [
      { name: 'Bryce Bayer', note: 'Kodak scientist, ordered dithering' },
      { name: 'Robert Floyd & Louis Steinberg', note: 'Error-diffusion algorithm (1976)' },
      { name: 'Bill Atkinson', note: 'Atkinson dithering for MacPaint (1984)' },
    ],
    why: 'Screens and printers could show only a few colours. Dithering patterns of dots trick the eye into seeing shades that do not exist.',
    birth: 'Like the 19th-century halftone screen, engineers wrote algorithms to distribute black and white dots. Early Mac and game graphics made the texture iconic, and artists now use it on purpose.',
  },
  'street-art': {
    born: '1980–1981 · Keith Haring’s subway chalk drawings · Blek le Rat’s Paris stencils',
    pioneers: [
      { name: 'Keith Haring', note: 'Chalk drawings on blank subway ad panels' },
      { name: 'Jean-Michel Basquiat', note: 'SAMO© texts (1977–80)' },
      { name: 'Blek le Rat', note: 'Father of stencil graffiti' },
      { name: 'Shepard Fairey & Banksy', note: 'OBEY (1989); stencils from the 1990s' },
    ],
    why: 'Artists wanted to reach ordinary people outside galleries, commenting on politics and public space where everyone could see it.',
    birth: 'Growing from graffiti but using images, stencils, posters and stickers, artists worked quickly and illegally. Later, festivals and cities began commissioning murals.',
  },
  'neo-expressionism': {
    born: 'Late 1970s · German Neue Wilde and Italian Transavanguardia (named 1979)',
    pioneers: [
      { name: 'Georg Baselitz & Anselm Kiefer', note: 'German history in paint and straw' },
      { name: 'Francesco Clemente & Sandro Chia', note: 'Transavanguardia, named by Achille Bonito Oliva' },
      { name: 'Julian Schnabel & Jean-Michel Basquiat', note: 'New York' },
    ],
    why: 'After a decade of Minimal and Conceptual art, artists and collectors hungered for painting again — big, figurative, raw and emotional.',
    birth: 'Painters returned to the human figure with rough brushwork and myth. The 1981 exhibition “A New Spirit in Painting” in London announced the revival.',
  },
  'fractal-art': {
    born: '1 March 1980 · first image of the Mandelbrot set at IBM',
    pioneers: [
      { name: 'Benoit Mandelbrot', note: 'Coined “fractal” (1975); The Fractal Geometry of Nature (1982)' },
      { name: 'Loren Carpenter', note: 'Vol Libre (1980), fractal mountains on screen' },
      { name: 'Gaston Julia & Pierre Fatou', note: 'Mathematics of the 1910s behind it' },
    ],
    why: 'Nature — coastlines, clouds, ferns — repeats itself at every scale. Computers finally made it possible to see equations of infinite complexity.',
    birth: 'Iterating a simple formula millions of times and colouring the results produced endless spirals. Fractal software became popular in the 1980s–90s, and film studios used fractals for terrain.',
  },
  '3d-art': {
    born: '1963 Sketchpad → 1972 Catmull’s Computer Animated Hand → 1980s workstations',
    pioneers: [
      { name: 'Ivan Sutherland', note: 'Sketchpad (1963), interactive computer graphics' },
      { name: 'Ed Catmull & Fred Parke', note: 'A Computer Animated Hand (1972)' },
      { name: 'Bui Tuong Phong & Martin Newell', note: 'Phong shading (1973), the Utah teapot (1975)' },
      { name: 'Pixar', note: 'Luxo Jr. (1986), Toy Story (1995)' },
    ],
    why: 'Researchers wanted computers to depict objects that did not exist — for engineering, flight simulation, film and eventually art.',
    birth: 'At the University of Utah and elsewhere, scientists invented polygons, shading, texture mapping and hidden-surface algorithms. Hollywood and games carried 3D into everyday culture.',
  },
  'net-art': {
    born: '1994–1996 · early web · the term “net.art” (1995)',
    pioneers: [
      { name: 'Vuk Ćosić', note: 'Found “net.art” in a garbled email' },
      { name: 'JODI (Joan Heemskerk & Dirk Paesmans)', note: 'wwwwwwwww.jodi.org (1995)' },
      { name: 'Olia Lialina', note: 'My Boyfriend Came Back from the War (1996)' },
      { name: 'Alexei Shulgin & Heath Bunting', note: 'Net activists and artists' },
    ],
    why: 'The web was a new public space without galleries or gatekeepers. Artists wanted to use its own language — links, code, browsers — as the medium.',
    birth: 'After the Mosaic browser (1993), artists built websites that broke, looped and played with HTML. Mailing lists like Nettime connected a small, international community.',
  },
  'glitch-art': {
    born: 'c. 2000 · databending and the aesthetics of failure · Menkman’s Glitch Studies Manifesto (2010)',
    pioneers: [
      { name: 'Nam June Paik', note: 'Magnet TV (1965), precursor' },
      { name: 'JODI & Ant Scott', note: 'Early glitch works and the beflix blog' },
      { name: 'Rosa Menkman', note: 'Theorist and artist, A Vernacular of File Formats (2010)' },
      { name: 'Takeshi Murata', note: 'Monster Movie (2005)' },
    ],
    why: 'As digital media became invisible and perfect, artists wanted to reveal the machine behind the image. Errors expose how technology really works.',
    birth: 'Artists opened image files in text editors, corrupted video compression and exploited broken hardware. Festivals such as GLI.TC/H (2010) gave the scene a name.',
  },
  'data-art': {
    born: 'c. 2000 · with roots in Minard (1869) and W. E. B. Du Bois (1900)',
    pioneers: [
      { name: 'Mark Hansen & Ben Rubin', note: 'Listening Post (2002)' },
      { name: 'Martin Wattenberg & Fernanda Viégas', note: 'Wind Map (2012)' },
      { name: 'Aaron Koblin', note: 'Flight Patterns (2005)' },
      { name: 'Refik Anadol', note: 'Data sculptures' },
    ],
    why: 'The internet and sensors produced more data than anyone could read. Artists turned invisible information into forms that people can feel.',
    birth: 'Artists borrowed tools from science and design — scraping, visualisation, sonification — to make portraits of flights, weather, language and cities.',
  },
  'generative-art': {
    born: '2001 · Processing released by Casey Reas & Ben Fry · roots in Harold Cohen’s AARON (1973)',
    pioneers: [
      { name: 'Harold Cohen', note: 'AARON, a drawing program developed from 1973' },
      { name: 'Casey Reas & Ben Fry', note: 'Created Processing at the MIT Media Lab' },
      { name: 'John Maeda', note: 'Design By Numbers (1999)' },
      { name: 'Tyler Hobbs & Erick Calderon', note: 'Fidenza (2021) and Art Blocks' },
    ],
    why: 'Artists wanted to design systems rather than single images — rules that produce endless unique results, with chance as collaborator.',
    birth: 'Free, easy tools like Processing let artists and designers code visuals. Communities shared sketches online, and in the 2020s blockchain platforms minted generative series.',
  },
  computational: {
    born: 'c. 2010 · real-time creative coding, sensors and simulation',
    pioneers: [
      { name: 'Zach Lieberman, Theo Watson, Arturo Castro', note: 'openFrameworks (2005)' },
      { name: 'teamLab', note: 'Collective founded in Tokyo in 2001 by Toshiyuki Inoko' },
      { name: 'Ryoji Ikeda & Random International', note: 'data.tron; Rain Room (2012)' },
      { name: 'Alan Turing', note: 'Morphogenesis paper (1952) behind reaction–diffusion' },
    ],
    why: 'Powerful GPUs, cheap sensors and the Kinect (2010) meant art could react and simulate in real time — living systems rather than fixed images.',
    birth: 'Creative coders combined physics, biology and machine vision to build immersive rooms and simulations. Studios of engineers and artists began producing work at architectural scale.',
  },
  'ai-art': {
    born: 'July 2015 · Google DeepDream · built on GANs (2014)',
    pioneers: [
      { name: 'Alexander Mordvintsev', note: 'Created DeepDream at Google' },
      { name: 'Ian Goodfellow', note: 'Invented generative adversarial networks (2014)' },
      { name: 'Mario Klingemann, Anna Ridler, Sougwen Chung, Refik Anadol', note: 'Artists working with machine learning' },
      { name: 'Harold Cohen', note: 'AARON, precursor from 1973' },
    ],
    why: 'Neural networks learned to recognise images — then to generate them. Artists asked what creativity, authorship and imagination mean when a machine can dream.',
    birth: 'DeepDream turned a classifier inside out to hallucinate eyes and dogs. GANs, then diffusion models (DALL·E 2, Stable Diffusion, 2022), made text-to-image generation available to millions.',
  },
  'post-digital': {
    born: '2000 · Kim Cascone coins “post-digital” · mainstream in the 2020s',
    pioneers: [
      { name: 'Kim Cascone', note: 'The Aesthetics of Failure (2000)' },
      { name: 'Nicholas Negroponte', note: '“Beyond Digital” (1998)' },
      { name: 'Hito Steyerl', note: 'Essays and video on the image after the internet' },
    ],
    why: 'When everything is digital, the digital stops being new. Artists mix analogue and digital freely and focus on the human, material and social effects of technology.',
    birth: 'Artists began printing screens, weaving algorithms, painting AI outputs and returning to craft, questioning networks, surveillance and ownership after NFTs (2021) and AI.',
  },
}
