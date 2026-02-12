// KNMT Tarievenboekje 2026 - Complete codes dataset

export interface KnmtCode {
  code: string;
  description: string;
  points: number | null;
  tariff: number | null;
  toelichting: string;
  requiresTooth: boolean;
  requiresSurface: boolean;
}

export interface KnmtSubcategory {
  name: string;
  codes: KnmtCode[];
}

export interface KnmtCategory {
  code: string;
  roman: string;
  name: string;
  subcategories: KnmtSubcategory[];
}

export const KNMT_CATEGORIES: KnmtCategory[] = [
  {
    code: 'C', roman: 'I', name: 'Consultatie en diagnostiek',
    subcategories: [
      {
        name: 'A: Consulten',
        codes: [
          { code: 'C001', description: 'Consult ten behoeve van een intake, inclusief bepalen en bespreken zorgdoel', points: 7.6, tariff: 57.01, toelichting: 'Eerste consult nieuwe patient. Inclusief anamnese, patientenkaart, status gebit, vervolgtraject en zorgdoel.', requiresTooth: false, requiresSurface: false },
          { code: 'C002', description: 'Consult voor een periodieke controle', points: 3.8, tariff: 28.51, toelichting: 'Algemeen periodiek mondonderzoek van gebit en tandvlees. Inclusief PPS score en kleine verrichtingen.', requiresTooth: false, requiresSurface: false },
          { code: 'C003', description: 'Consult, niet zijnde periodieke controle', points: 3.8, tariff: 28.51, toelichting: 'Apart consult op initiatief patient (klacht/vraag) of vervolgconsult. Inclusief DETI-score en behandelplan.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B: Diagnostisch onderzoek',
        codes: [
          { code: 'C010', description: 'Aanvullende medische anamnese na (schriftelijke) routinevragen', points: 3.8, tariff: 28.51, toelichting: 'Aanvullende medische anamnese als meer informatie nodig is. Inclusief bespreking patient en overleg huisarts/specialist.', requiresTooth: false, requiresSurface: false },
          { code: 'C011', description: 'Uitgebreid onderzoek ten behoeve van een second opinion', points: 18, tariff: 135.03, toelichting: 'Uitgebreid mondonderzoek voor second opinion over diagnose/behandelplan van andere zorgaanbieder. Inclusief schriftelijk oordeel.', requiresTooth: false, requiresSurface: false },
          { code: 'C012', description: 'Uitgebreid onderzoek ten behoeve van het integrale behandelplan', points: 18, tariff: 135.03, toelichting: 'Uitgebreid mondonderzoek van harde/zachte weefsels en tandheelkundig werk. Inclusief integraal behandelplan.', requiresTooth: false, requiresSurface: false },
          { code: 'C013', description: 'Studiemodellen', points: 5, tariff: 37.51, toelichting: 'Afdruk boven- en onderkaak voor studiemodellen, slijtagemonitoring of mock-up van geplande behandeling.', requiresTooth: false, requiresSurface: false },
          { code: 'C014', description: 'Pocketregistratie', points: 6, tariff: 45.01, toelichting: 'Exploratief sonderen pocketdiepte rondom alle tanden en kiezen. Vastleggen pockets >3mm en bloedingslocaties.', requiresTooth: false, requiresSurface: false },
          { code: 'C015', description: 'Parodontiumregistratie', points: 12, tariff: 90.02, toelichting: 'Uitgebreide pocketregistratie met sondeerdiepte, aanhechtingsverlies, mobiliteit, furcaties en bespreking met patient.', requiresTooth: false, requiresSurface: false },
          { code: 'C016', description: 'Maken en bespreken van een restauratieve proefopstelling', points: 30, tariff: 225.05, toelichting: 'Analoge of digitale diagnostische proefopstelling bij 4+ elementen. Inclusief digitaal eindresultaat en bespreking.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'C: Diversen',
        codes: [
          { code: 'C020', description: 'Toeslag mondzorg aan huis', points: 3, tariff: 22.51, toelichting: 'Toeslag voor behandeling aan huis. Eenmaal per huisbezoek. Niet vanuit mobiele praktijk.', requiresTooth: false, requiresSurface: false },
          { code: 'C021', description: 'Toeslag avond, nacht en weekend uren (anw-uren)', points: 4.2, tariff: 31.51, toelichting: 'Toeslag voor avond-, nacht- en weekenduren (18:00-08:00, weekend, feestdagen). Alleen in combinatie met andere prestatie.', requiresTooth: false, requiresSurface: false },
          { code: 'C022', description: 'Droogleggen van elementen door middel van een rubberen lapje', points: 2, tariff: 15.00, toelichting: 'Aanbrengen rubberdam voor isolatie. Per keer, ongeacht aantal elementen. Alleen bij E-, V-, R-codes en M80/M81.', requiresTooth: false, requiresSurface: false },
          { code: 'C023', description: 'Toeslag specifieke mondzorg aan huis', points: 13, tariff: 97.52, toelichting: 'Toeslag voor verzamelen en inpakken materialen/apparatuur bij thuisbehandeling. Inclusief assistent en installatie.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'X', roman: 'II', name: "Maken en/of beoordelen foto's",
    subcategories: [
      {
        name: "Foto's",
        codes: [
          { code: 'X10', description: 'Maken en beoordelen kleine rontgenfoto', points: 2.8, tariff: 21.00, toelichting: 'Per opname. Kleine intra-orale rontgenfoto.', requiresTooth: false, requiresSurface: false },
          { code: 'X11', description: 'Beoordelen kleine rontgenfoto', points: 2.1, tariff: 15.75, toelichting: 'Beoordelen kleine rontgenfoto. Niet door dezelfde praktijk als X10.', requiresTooth: false, requiresSurface: false },
          { code: 'X21', description: 'Maken en beoordelen kaakoverzichtsfoto', points: 12, tariff: 90.02, toelichting: 'Kaakoverzichtsfoto (OPT). Niet voor implantologie in edentate kaak (zie X22).', requiresTooth: false, requiresSurface: false },
          { code: 'X22', description: 'Maken en beoordelen kaakoverzichtsfoto t.b.v. implantologie in de tandeloze kaak', points: 12, tariff: 90.02, toelichting: 'Kaakoverzichtsfoto specifiek voor implantologie in tandeloze kaak.', requiresTooth: false, requiresSurface: false },
          { code: 'X23', description: 'Beoordelen kaakoverzichtsfoto', points: 4.4, tariff: 33.01, toelichting: 'Beoordelen kaakoverzichtsfoto gemaakt via X21/X22. Niet door dezelfde praktijk.', requiresTooth: false, requiresSurface: false },
          { code: 'X24', description: 'Maken en beoordelen schedelfoto', points: 5.4, tariff: 40.51, toelichting: 'Maken en beoordelen van een schedelfoto (laterale cefalometrische opname).', requiresTooth: false, requiresSurface: false },
          { code: 'X34', description: 'Beoordelen schedelfoto', points: 4, tariff: 30.01, toelichting: 'Beoordelen schedelfoto. Niet door dezelfde praktijk als X24.', requiresTooth: false, requiresSurface: false },
          { code: 'X25', description: 'Maken en beoordelen meerdimensionale kaakfoto', points: 34, tariff: 255.06, toelichting: 'Meerdimensionale kaakfoto (CBCT). Alleen als meerwaarde t.o.v. conventionele rontgendiagnostiek.', requiresTooth: false, requiresSurface: false },
          { code: 'X26', description: 'Beoordelen meerdimensionale kaakfoto', points: 10, tariff: 75.02, toelichting: 'Beoordelen meerdimensionale kaakfoto en bespreken met patient. Niet door dezelfde praktijk als X25.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'M', roman: 'III', name: 'Preventieve mondzorg',
    subcategories: [
      {
        name: 'Preventie',
        codes: [
          { code: 'M01', description: 'Preventieve voorlichting en/of instructie, per vijf minuten', points: 2.24, tariff: 16.82, toelichting: 'Voorlichting/instructie per 5 min. Kleuren plaque, plaquescore, voedingsadviezen, afleren negatieve gewoontes.', requiresTooth: false, requiresSurface: false },
          { code: 'M02', description: 'Consult voor evaluatie van preventie, per vijf minuten', points: 2.24, tariff: 16.82, toelichting: 'Evaluatie preventie per 5 min. Opnieuw kleuren plaque, plaquescore vastleggen, bijsturen eerdere instructies.', requiresTooth: false, requiresSurface: false },
          { code: 'M03', description: 'Gebitsreiniging, per vijf minuten', points: 2.24, tariff: 16.82, toelichting: 'Verwijderen plaque/tandsteen en polijsten per 5 minuten. Afgerond naar dichtstbijzijnde veelvoud van 5 min.', requiresTooth: false, requiresSurface: false },
          { code: 'M05', description: 'Niet-restauratieve behandeling van caries in het melkgebit', points: 4.5, tariff: 33.76, toelichting: 'NRCT/UCT behandeling melkgebit. Beslijpen caviteit, behandelen carieuze dentine, beschermlaag, fluoride.', requiresTooth: true, requiresSurface: false },
          { code: 'M32', description: 'Eenvoudig bacteriologisch- of enzymatisch onderzoek', points: 3, tariff: 22.51, toelichting: 'Nemen plaque-/speekselmonster en interpreteren bacteriologische/enzymatische gegevens in de praktijk.', requiresTooth: false, requiresSurface: false },
          { code: 'M30', description: 'Behandeling van gevoelige tandhalzen en (preventief) toedienen medicament', points: 1, tariff: 7.50, toelichting: 'Per element. Behandeling gevoelige tandhalzen met fluoride- of chloorhexidinepreparaten. Max 5 elementen.', requiresTooth: true, requiresSurface: false },
          { code: 'M40', description: 'Fluoridebehandeling', points: 2.5, tariff: 18.75, toelichting: 'Per kaak. Inclusief polijsten. Voor >5 elementen met fluoride/chloor-hexidine. Bij <5 elementen geldt M30.', requiresTooth: false, requiresSurface: false },
          { code: 'M61', description: 'Mondbeschermer of fluoridekap', points: 4.5, tariff: 33.76, toelichting: 'Afdrukken en plaatsing mondbeschermer/fluoridekap. Inclusief occlusieafdruk onderkaak. Ook voor sport.', requiresTooth: false, requiresSurface: false },
          { code: 'M80', description: 'Behandeling van witte vlekken, eerste element', points: 8.7, tariff: 65.26, toelichting: 'Per element. Behandeling fluorose/cariogene witte plekjes met micro-invasieve infiltratievloeistof. Inclusief etsen.', requiresTooth: true, requiresSurface: false },
          { code: 'M81', description: 'Behandeling van witte vlekken, volgend element', points: 4.8, tariff: 36.01, toelichting: 'Per volgend element. Behandeling witte vlekken met micro-invasieve infiltratievloeistof. Inclusief etsen.', requiresTooth: true, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'A', roman: 'IV', name: 'Verdoving',
    subcategories: [
      {
        name: 'Verdoving',
        codes: [
          { code: 'A10', description: 'Geleidings-, infiltratie- en/of intraligamentaire verdoving', points: 2.5, tariff: 18.75, toelichting: 'Per blok in onderkaak, per twee naast elkaar liggende elementen in bovenkaak. Intraligamentaire/intraossale verdoving per element.', requiresTooth: false, requiresSurface: false },
          { code: 'A15', description: 'Oppervlakte verdoving', points: 1.3, tariff: 9.75, toelichting: 'Per kaakhelft. Alleen als niet gevolgd door A10.', requiresTooth: false, requiresSurface: false },
          { code: 'A20', description: 'Behandeling onder algehele anesthesie of sedatie', points: 0, tariff: 0, toelichting: 'Kostprijs. Kosten anesthesioloog voor algehele anesthesie/sedatie. Inclusief voorlichting en medisch onderzoek.', requiresTooth: false, requiresSurface: false },
          { code: 'A30', description: 'Voorbereiding behandeling onder algehele anesthesie', points: 8, tariff: 60.01, toelichting: 'Organisatie van behandeling onder algehele anesthesie in een instelling. Niet in combinatie met A20.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'B', roman: 'V', name: 'Verdoving door middel van een roesje',
    subcategories: [
      {
        name: 'Roesje (lachgassedatie)',
        codes: [
          { code: 'B10', description: 'Introductie roesje (lachgassedatie)', points: 5, tariff: 37.51, toelichting: 'Eenmalige uitleg over toepassing lachgassedatie. Eenmaal per behandeling.', requiresTooth: false, requiresSurface: false },
          { code: 'B11', description: 'Toediening roesje (lachgassedatie)', points: 5, tariff: 37.51, toelichting: 'Per zitting in rekening te brengen.', requiresTooth: false, requiresSurface: false },
          { code: 'B12', description: 'Overheadkosten roesje (lachgassedatie)', points: 0, tariff: 45.34, toelichting: 'Per zitting in rekening te brengen. Overheadkosten apparatuur en materiaal.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'V', roman: 'VI', name: 'Vullingen',
    subcategories: [
      {
        name: 'A: Vullingen en volledig vormherstel tand of kies',
        codes: [
          { code: 'V71', description: 'Eenvlaksvulling amalgaam', points: 4.2, tariff: 31.51, toelichting: 'Amalgaamvulling in een vlak. Per zitting eenmaal per vlak declarabel.', requiresTooth: true, requiresSurface: true },
          { code: 'V72', description: 'Tweevlaksvulling amalgaam', points: 6.7, tariff: 50.26, toelichting: 'Amalgaamvulling in twee vlakken van tand of kies.', requiresTooth: true, requiresSurface: true },
          { code: 'V73', description: 'Drievlaksvulling amalgaam', points: 8.7, tariff: 65.26, toelichting: 'Amalgaamvulling in drie vlakken van tand of kies.', requiresTooth: true, requiresSurface: true },
          { code: 'V74', description: 'Meervlaksvulling amalgaam', points: 12.7, tariff: 95.27, toelichting: 'Amalgaamvulling vier+ vlakken of drie vlakken + knobbel. Inclusief parapulpaire stift indien nodig.', requiresTooth: true, requiresSurface: true },
          { code: 'V81', description: 'Eenvlaksvulling glasionomeer/glascarbomeer/compomeer', points: 6.2, tariff: 46.51, toelichting: 'Glasionomeer/glascarbomeer/compomeer vulling in een vlak. Per zitting eenmaal per vlak.', requiresTooth: true, requiresSurface: true },
          { code: 'V82', description: 'Tweevlaksvulling glasionomeer/glascarbomeer/compomeer', points: 8.7, tariff: 65.26, toelichting: 'Glasionomeer/glascarbomeer/compomeer vulling in twee vlakken.', requiresTooth: true, requiresSurface: true },
          { code: 'V83', description: 'Drievlaksvulling glasionomeer/glascarbomeer/compomeer', points: 10.7, tariff: 80.27, toelichting: 'Glasionomeer/glascarbomeer/compomeer vulling in drie vlakken.', requiresTooth: true, requiresSurface: true },
          { code: 'V84', description: 'Meervlaksvulling glasionomeer/glascarbomeer/compomeer', points: 14.2, tariff: 106.52, toelichting: 'Glasionomeer/glascarbomeer/compomeer vulling vier+ vlakken of drie vlakken + knobbel.', requiresTooth: true, requiresSurface: true },
          { code: 'V91', description: 'Eenvlaksvulling composiet', points: 8, tariff: 60.01, toelichting: 'Composietvulling in een vlak. Per zitting eenmaal per vlak. Niet voor herstel retentie-apparatuur.', requiresTooth: true, requiresSurface: true },
          { code: 'V92', description: 'Tweevlaksvulling composiet', points: 10.5, tariff: 78.77, toelichting: 'Composietvulling in twee vlakken van tand of kies.', requiresTooth: true, requiresSurface: true },
          { code: 'V93', description: 'Drievlaksvulling composiet', points: 12.5, tariff: 93.77, toelichting: 'Composietvulling in drie vlakken of een hoek in het front (cuspidaat-cuspidaat).', requiresTooth: true, requiresSurface: true },
          { code: 'V94', description: 'Meervlaksvulling composiet', points: 16, tariff: 120.03, toelichting: 'Composietvulling vier+ vlakken of drie vlakken + knobbel. Niet bij een hoekopbouw in front (dan V93).', requiresTooth: true, requiresSurface: true },
          { code: 'V95', description: 'Volledig vormherstel tand of kies met composiet (herstel anatomische kroon)', points: 25, tariff: 187.54, toelichting: 'Composietvulling alle vlakken + tenminste 1/3 kroonhoogte hersteld. Niet met V15/V71-V94 op zelfde element.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B: Stiften',
        codes: [
          { code: 'V80', description: 'Aanbrengen eerste wortelkanaalstift', points: 5.8, tariff: 43.51, toelichting: 'Confectie wortelkanaalstift in wortelkanaal na endodontische behandeling. Inclusief boren en cementeren.', requiresTooth: true, requiresSurface: false },
          { code: 'V85', description: 'Aanbrengen van elke volgende wortelkanaalstift in hetzelfde element', points: 3.8, tariff: 28.51, toelichting: 'Elke volgende confectiestift in hetzelfde element. Alleen volgend op V80 in dezelfde zitting.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'C: Diversen',
        codes: [
          { code: 'V15', description: 'Aanbrengen schildje van tandkleurig plastisch materiaal (facing)', points: 12, tariff: 90.02, toelichting: 'Composiet facing op lip-/wangzijde van tand of kies. Inclusief preparatie, plaatsing en polijsten.', requiresTooth: true, requiresSurface: false },
          { code: 'V30', description: 'Aanbrengen van fissuurlak eerste element (sealen)', points: 4.5, tariff: 33.76, toelichting: 'Fissuurlak (sealant) op eerste element ter voorkoming caries. Niet met V71-V95 op zelfde element.', requiresTooth: true, requiresSurface: false },
          { code: 'V35', description: 'Aanbrengen van fissuurlak (sealen) ieder volgend element in dezelfde zitting', points: 2.5, tariff: 18.75, toelichting: 'Fissuurlak op volgend element in dezelfde zitting. Alleen volgend op V30.', requiresTooth: true, requiresSurface: false },
          { code: 'V40', description: 'Het polijsten, beslijpen en bijwerken van oude vullingen', points: 1, tariff: 7.50, toelichting: 'Polijsten/bijwerken oude vulling(en) in een tand of kies. Niet bij nieuwe vulling. Niet met V71-V95.', requiresTooth: true, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'E', roman: 'VII', name: 'Wortelkanaalbehandelingen',
    subcategories: [
      {
        name: 'A: Onderzoek, diagnostiek en behandelplanning',
        codes: [
          { code: 'E02', description: 'Uitgebreid wortelkanaalbehandeling consult bij CEB II of III', points: 7, tariff: 52.51, toelichting: 'Onderzoek oorzaak klacht, DETI-score, CEB invullen, endodontisch behandelplan bespreken. Alleen bij CEB II of III.', requiresTooth: true, requiresSurface: false },
          { code: 'E03', description: 'Beoordelen trauma na tandheelkundig ongeval', points: 5.5, tariff: 41.26, toelichting: 'Uitgebreide beoordeling van beschadigde tanden/kiezen na trauma. Max 2 elementen per zorgaanbieder, 6 per ongeval.', requiresTooth: true, requiresSurface: false },
          { code: 'E05', description: 'Onderzoek ten behoeve van de uitvoering van een complexe endodontische behandeling van een verwezen patient', points: 13.4, tariff: 100.52, toelichting: 'Eenmaal per complexe endodontische behandeling (CEB II/III) bij verwezen patient. Inclusief behandelplan en bespreking.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.1: Pulpabehandeling met als doel behoud van vitaliteit',
        codes: [
          { code: 'E60', description: 'Geheel of gedeeltelijk weghalen van pulpaweefsel', points: 8, tariff: 60.01, toelichting: 'Totale of partiele pulpotomie. Verwijderen beschadigd pulpaweefsel, controleren bloeding, hermetisch afsluiten.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.2: Wortelkanaalbehandeling element met gesloten wortelpunt, ongecompliceerd',
        codes: [
          { code: 'E04', description: 'Toeslag voor kosten bij gebruik van roterende nikkel-titanium instrumenten', points: 0, tariff: 59.25, toelichting: 'Eenmalig per behandeling. Alleen met E13, E14, E16, E17, E54, E61, E77, U05, U25, U35.', requiresTooth: true, requiresSurface: false },
          { code: 'E13', description: 'Wortelkanaalbehandeling per element met 1 kanaal', points: 18, tariff: 135.03, toelichting: 'Openen tandholte, lengte bepalen, vormgeven, irrigeren, kanaalvulling met wortelkanaalcement. Per element.', requiresTooth: true, requiresSurface: false },
          { code: 'E14', description: 'Wortelkanaalbehandeling per element met 2 kanalen', points: 26, tariff: 195.04, toelichting: 'Wortelkanaalbehandeling element met 2 kanalen. Inclusief openen, vormgeven, irrigeren en vullen.', requiresTooth: true, requiresSurface: false },
          { code: 'E16', description: 'Wortelkanaalbehandeling per element met 3 kanalen', points: 34, tariff: 255.06, toelichting: 'Wortelkanaalbehandeling element met 3 kanalen. Inclusief openen, vormgeven, irrigeren en vullen.', requiresTooth: true, requiresSurface: false },
          { code: 'E17', description: 'Wortelkanaalbehandeling per element met 4 of meer kanalen', points: 42, tariff: 315.07, toelichting: 'Wortelkanaalbehandeling element met 4+ kanalen. Inclusief openen, vormgeven, irrigeren en vullen.', requiresTooth: true, requiresSurface: false },
          { code: 'E85', description: 'Elektronische lengtebepaling', points: 2.5, tariff: 18.75, toelichting: 'Per element in rekening te brengen. Elektronische bepaling wortelkanaallengte.', requiresTooth: true, requiresSurface: false },
          { code: 'E19', description: 'Tijdelijk afsluiten een element na start wortelkanaalbehandeling', points: 3, tariff: 22.51, toelichting: 'Per element, per zitting. Tijdelijke afsluiting als behandeling niet in een zitting kan worden voltooid.', requiresTooth: true, requiresSurface: false },
          { code: 'E66', description: 'Wortelkanaalbehandeling van melkelement', points: 8, tariff: 60.01, toelichting: 'Per melkelement met calciumhydroxide.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.3: Toeslagen bij complicaties bij wortelkanaalbehandelingen',
        codes: [
          { code: 'E52', description: 'Toeslag in geval van een moeilijke wortelkanaalopening', points: 5, tariff: 37.51, toelichting: 'Toeslag bij moeilijke kanaalopening door gegoten opbouw, keramische vulling, stiftopbouw, extreme inclinatie, beperkte mondopening. DETI-score B, CEB II/III.', requiresTooth: true, requiresSurface: false },
          { code: 'E53', description: 'Toeslag verwijderen van wortelstift', points: 7, tariff: 52.51, toelichting: 'Verwijderen wortelstift van metaal, koolstofvezel, glasvezel of keramiek. Per kanaal. DETI-score B, CEB II/III.', requiresTooth: true, requiresSurface: false },
          { code: 'E54', description: 'Toeslag verwijderen van wortelkanaalvulmateriaal', points: 5, tariff: 37.51, toelichting: 'Toeslag verwijderen wortelkanaalvulmateriaal van eerdere behandeling. Per kanaal. DETI-score B, CEB II/III.', requiresTooth: true, requiresSurface: false },
          { code: 'E55', description: 'Toeslag behandeling dichtgeslibd of verkalkt wortelkanaal', points: 5, tariff: 37.51, toelichting: 'Bij kanalen die niet zichtbaar zijn op rontgenfoto en onmogelijk om met vijl #10 te penetreren. Per kanaal.', requiresTooth: true, requiresSurface: false },
          { code: 'E56', description: 'Toeslag voortgezette behandeling bij weefselschade van de tandwortel', points: 7, tariff: 52.51, toelichting: 'Toeslag bij voortzetting afgebroken behandeling door verkalkte kanalen, obstructies, perforatie etc. Per kanaal.', requiresTooth: true, requiresSurface: false },
          { code: 'E57', description: 'Toeslag behandeling van element met uitzonderlijke anatomie', points: 5, tariff: 37.51, toelichting: 'Toeslag bij C-/S-vorm, dens in dente, dilaceratie, resorptiedefect, taurodontie. Per element.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.4: Apexificatieprocedure van element met open wortelpunt',
        codes: [
          { code: 'E61', description: 'Behandelen van open wortelpunt met een desinfectiemiddel, eerste zitting', points: 14, tariff: 105.02, toelichting: 'Openen tandholte, lengte bepalen, vormgeven, irrigeren en aanbrengen desinfectiemiddel. Eerste zitting.', requiresTooth: true, requiresSurface: false },
          { code: 'E62', description: 'Behandelen van open wortelpunt met een desinfectiemiddel, elke volgende zitting', points: 9, tariff: 67.52, toelichting: 'Opnieuw openen, controleren apicale barriere, irrigeren en verversen desinfectiemiddel.', requiresTooth: true, requiresSurface: false },
          { code: 'E63', description: 'Toeslag voor afsluiting met calciumsilicaatcement of een vergelijkbaar biokeramisch materiaal', points: 7.5, tariff: 56.26, toelichting: 'Per element. Aanbrengen apicale barriere met calciumsilicaatcement. Toeslag bij E13-E17.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.5: Initiele wortelkanaalbehandeling',
        codes: [
          { code: 'E77', description: 'Initiele wortelkanaalbehandeling, eerste kanaal', points: 10, tariff: 75.02, toelichting: 'Spoedbehandeling: openen tandholte, extirpatie, kanalen toegankelijk maken, irrigeren, desinfectiemiddel insluiten.', requiresTooth: true, requiresSurface: false },
          { code: 'E78', description: 'Initiele wortelkanaalbehandeling, elk volgend kanaal', points: 5, tariff: 37.51, toelichting: 'Spoedbehandeling elk volgend kanaal. Zelfde handelingen als E77.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.6: Bleken',
        codes: [
          { code: 'E90', description: 'Inwendig bleken, eerste zitting', points: 8, tariff: 60.01, toelichting: 'Verwijderen vulmateriaal uit pulpakamer, lekvrije onderlaag aanbrengen, bleekmateriaal insluiten. Per element.', requiresTooth: true, requiresSurface: false },
          { code: 'E95', description: 'Inwendig bleken, elke volgende zitting', points: 3, tariff: 22.51, toelichting: 'Vervangen bleekmateriaal in volgende zitting. Per element.', requiresTooth: true, requiresSurface: false },
          { code: 'E97', description: 'Uitwendig bleken per kaak', points: 12.5, tariff: 93.77, toelichting: 'Afdrukken, plaatsen bleekhoes en gebruiksinstructie. Per kaak, ongeacht aantal elementen.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.7: Behandeling trauma-element',
        codes: [
          { code: 'E40', description: 'Directe pulpa-overkapping', points: 5, tariff: 37.51, toelichting: 'Bij trauma-elementen met pulpa-expositie in niet-geinfecteerd dentine. Hermetisch afsluitende restauratie.', requiresTooth: true, requiresSurface: false },
          { code: 'E42', description: 'Terugzetten van een verplaatst element na tandheelkundig ongeval', points: 2, tariff: 15.00, toelichting: 'Repositie geluxeerd element handmatig of met extractietang na tandheelkundig ongeval.', requiresTooth: true, requiresSurface: false },
          { code: 'E43', description: 'Vastzetten element d.m.v. een spalk na tandheelkundig ongeval', points: 4, tariff: 30.01, toelichting: 'Fixatiespalk van draad/composiet (inclusief etsen) bij loszittend element na trauma. Per element.', requiresTooth: true, requiresSurface: false },
          { code: 'E44', description: 'Verwijderen spalk ten behoeve van de behandeling van een trauma-element', points: 1, tariff: 7.50, toelichting: 'Verwijderen spalk, wegslijpen composiet en polijsten. Per element waaraan spalk is bevestigd.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.8: Microchirurgische wortelkanaalbehandelingen',
        codes: [
          { code: 'E31', description: 'Microchirurgische wortelkanaalbehandeling snij-/hoektand', points: 20, tariff: 150.03, toelichting: 'Flap, wortelpunt vrijmaken, osteo-ectomie, ontstekingsweefsel verwijderen, hechtingen. Exclusief E86/E87.', requiresTooth: true, requiresSurface: false },
          { code: 'E32', description: 'Microchirurgische wortelkanaalbehandeling premolaar', points: 28, tariff: 210.05, toelichting: 'Microchirurgische wortelkanaalbehandeling premolaar. Flap, osteo-ectomie, hechtingen. Exclusief E86/E87.', requiresTooth: true, requiresSurface: false },
          { code: 'E33', description: 'Microchirurgische wortelkanaalbehandeling molaar', points: 36, tariff: 270.06, toelichting: 'Microchirurgische wortelkanaalbehandeling molaar. Flap, osteo-ectomie, hechtingen. Exclusief E86/E87.', requiresTooth: true, requiresSurface: false },
          { code: 'E34', description: 'Aanbrengen retrograde vulling', points: 4, tariff: 30.01, toelichting: 'Retrograde vulling in wortelpunt van onderaf met lekvrij materiaal. Per kanaal.', requiresTooth: true, requiresSurface: false },
          { code: 'E36', description: 'Het trekken en terugplaatsen van een element', points: 14, tariff: 105.02, toelichting: 'Intentionele replantatie. Exclusief eventueel sluiten perforatie, retrograde vulling en spalk.', requiresTooth: true, requiresSurface: false },
          { code: 'E37', description: 'Kijkoperatie', points: 12, tariff: 90.02, toelichting: 'Diagnostische flap ter inspectie wortel bij vermoeden van wortelfracturen, perforaties of botdefecten.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.9: Opvullen van de pulpakamer en afsluiten van de kanaalingangen',
        codes: [
          { code: 'E88', description: 'Opvullen van de pulpakamer en afsluiten van de kanaalingangen', points: 10, tariff: 75.02, toelichting: 'Diepe vulling zonder wortelstift om kanaalingangen en pulpakamer af te sluiten. Versterkt tand/kies.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.10: Met microscopische vergroting inspecteren en beoordelen element',
        codes: [
          { code: 'E86', description: 'Met microscopische vergroting inspecteren en beoordelen element ten behoeve van de wortelkanaalbehandeling', points: 13.5, tariff: 101.27, toelichting: 'Microscopisch inspecteren pulpakamer en wortelkanalen op verkalkingen, extra kanalen, cracks. Per wortelkanaalbehandeling.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B.11: Gebruiksklaar maken praktijkruimte',
        codes: [
          { code: 'E87', description: 'Gebruiksklaar maken van praktijkruimte voor microchirurgische wortelkanaalbehandeling', points: 10, tariff: 75.02, toelichting: 'Steriel maken praktijkruimte voor microchirurgie. Alleen bij E31-E37 en bijzondere maatregelen.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  // __REMAINING_R_G_H_P_T_J_U_Y_F__
];

// Helper to get flat list of all codes
export function getAllKnmtCodes(): (KnmtCode & { category: string; subcategory: string })[] {
  return KNMT_CATEGORIES.flatMap(cat =>
    cat.subcategories.flatMap(sub =>
      sub.codes.map(code => ({ ...code, category: cat.code, subcategory: sub.name }))
    )
  );
}

// Category label map for UI display
export const CATEGORY_LABELS: Record<string, string> = {
  'C': 'Consultatie en diagnostiek',
  'X': "Foto's",
  'M': 'Preventieve mondzorg',
  'A': 'Verdoving',
  'B': 'Roesje (lachgassedatie)',
  'V': 'Vullingen',
  'E': 'Wortelkanaalbehandelingen',
  'R': 'Kronen en bruggen',
  'G': 'Kauwstelsel (OPD)',
  'H': 'Chirurgische ingrepen',
  'P': 'Kunstgebitten',
  'T': 'Tandvleesbehandelingen',
  'J': 'Implantaten',
  'U': 'Uurtarieven',
  'Y': 'Informatieverstrekking',
  'F': 'Orthodontie',
};
