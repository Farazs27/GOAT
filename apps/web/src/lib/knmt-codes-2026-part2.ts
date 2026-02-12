// KNMT Tarievenboekje 2026 - Part 2: Categories H, P, T, J, U, Y, F

export const KNMT_PART2 = [
  {
    code: 'H', roman: 'X', name: 'Chirurgische ingrepen',
    subcategories: [
      {
        name: 'A: Onderdeel A',
        codes: [
          { code: 'H11', description: 'Trekken tand of kies', points: 7.5, tariff: 56.26, toelichting: 'Inclusief eventueel hechten, kosten hechtmateriaal en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'H16', description: 'Trekken volgende tand of kies, in dezelfde zitting en hetzelfde kwadrant', points: 5.6, tariff: 42.01, toelichting: 'Inclusief eventueel hechten, kosten hechtmateriaal en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'H21', description: 'Kosten hechtmateriaal', points: null, tariff: 7.50, toelichting: 'Extra in rekening te brengen bij verrichtingen uit hoofdstuk H, met uitzondering van H11, H16, H38 en H39.', requiresTooth: false, requiresSurface: false },
          { code: 'H26', description: 'Hechten weke delen', points: 11, tariff: 82.52, toelichting: 'Bijvoorbeeld liphechtingen inclusief wondtoilet.', requiresTooth: false, requiresSurface: false },
          { code: 'H50', description: 'Terugzetten tand of kies, eerste element', points: 10, tariff: 75.02, toelichting: 'Exclusief wortelkanaalbehandeling. Inclusief tijdelijke fixatie, hechten en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'H55', description: 'Terugzetten tand of kies, volgend element in dezelfde zitting', points: 3, tariff: 22.51, toelichting: 'Exclusief wortelkanaalbehandeling. Alleen volgend op H50 in dezelfde zitting.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'B: Onderdeel B',
        codes: [
          { code: 'H90', description: 'Voorbereiding praktijkruimte ten behoeve van chirurgische verrichtingen', points: 10, tariff: 75.02, toelichting: 'Voor chirurgie gereed maken van de praktijkruimte met de vereiste steriliteit. Niet in combinatie met H33, H36, H37, H38 en H39.', requiresTooth: false, requiresSurface: false },
          { code: 'H33', description: 'Hemisectie van een molaar', points: 12, tariff: 90.02, toelichting: 'Inclusief hechten en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'H34', description: 'Vrijleggen ingesloten tand of kies ter bevordering van de doorbraak', points: 12, tariff: 90.02, toelichting: 'Verwijderen van tandvlees en kaakbot om een niet doorgebroken element vrij te leggen. Niet in combinatie met H11, H16 en H35.', requiresTooth: true, requiresSurface: false },
          { code: 'H35', description: 'Moeizaam trekken tand of kies met behulp van chirurgie', points: 12, tariff: 90.02, toelichting: 'Chirurgische verwijdering waarbij minimaal twee van de volgende handelingen zijn uitgevoerd: splitsen wortels, wegboren kaakbot, opklappen tandvlees.', requiresTooth: true, requiresSurface: false },
          { code: 'H36', description: 'Onderzoek ten behoeve van de indicatiestelling voor een autotransplantaat behandeling', points: 13, tariff: 97.52, toelichting: 'Onderzoek, voorlichting en globale beoordeling of autotransplantaat is geindiceerd. Ongeacht het aantal zittingen.', requiresTooth: false, requiresSurface: false },
          { code: 'H37', description: 'Onderzoek ten behoeve van de uitvoering voor een autotransplantaat behandeling', points: 20, tariff: 150.03, toelichting: 'Eenmaal per behandeling. Inclusief uitgebreide anamnese, botmetingen, studiemodellen en behandelplan.', requiresTooth: false, requiresSurface: false },
          { code: 'H38', description: 'Uitvoeren eerste autotransplantaat', points: 45.8, tariff: 343.58, toelichting: 'Transplantaat van tand of kies inclusief verdoving, postoperatieve nazorg en hechtingen verwijderen.', requiresTooth: true, requiresSurface: false },
          { code: 'H39', description: 'Uitvoeren volgende autotransplantaat, in dezelfde zitting', points: 18.9, tariff: 141.78, toelichting: 'Transplantaat van volgende tand of kies in dezelfde zitting, alleen volgend op H38.', requiresTooth: true, requiresSurface: false },
          { code: 'H40', description: 'Corrigeren van de vorm van de kaak, per kaak', points: 9, tariff: 67.52, toelichting: 'Correctie processus alveolaris. Als zelfstandige verrichting, inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
          { code: 'H41', description: 'Verwijderen van het lipbandje of tongriempje', points: 6, tariff: 45.01, toelichting: 'Frenulum extirpatie. Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.1: Wortelpuntoperatie per tandwortel',
        codes: [
          { code: 'H42', description: 'Wortelpuntoperatie, per tandwortel, zonder afsluiting', points: 12, tariff: 90.02, toelichting: 'Apexresectie na endodontische behandeling; maximaal twee apices per element. Inclusief hechten en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'H43', description: 'Wortelpuntoperatie, per tandwortel, met ante of retrogradeafsluiting', points: 16, tariff: 120.03, toelichting: 'Apexresectie met afsluiting na endodontische behandeling; maximaal twee apices per element. Inclusief hechten en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'H44', description: 'Primaire antrumsluiting', points: 11, tariff: 82.52, toelichting: 'Het zodanig hechten dat de randen van het slijmvlies zonder spanning aansluiten. Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
          { code: 'H59', description: 'Behandeling kaakbreuk, per kaak', points: 14, tariff: 105.02, toelichting: 'Fractuur van processus alveolaris. Als zelfstandige verrichting; inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.2: Cyste-operatie',
        codes: [
          { code: 'H60', description: 'Marsupialisatie', points: 14, tariff: 105.02, toelichting: 'Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
          { code: 'H65', description: 'Primaire sluiting', points: 27, tariff: 202.55, toelichting: 'Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.3: Correctie van het prothesedragende deel per kaak',
        codes: [
          { code: 'H70', description: 'Lappige fibromen, Schlotterkamm, tubercorrectie e.d., enkelzijdig per kaak', points: 14, tariff: 105.02, toelichting: 'Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
          { code: 'H75', description: 'Lappige fibromen, Schlotterkamm, tubercorrectie e.d., dubbelzijdig per kaak', points: 27, tariff: 202.55, toelichting: 'Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
          { code: 'H80', description: 'Alveolotomie torus, vergelijkbare praeprothetische botcorrecties, enkelzijdig per kaak', points: 19, tariff: 142.53, toelichting: 'Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
          { code: 'H85', description: 'Alveolotomie torus, vergelijkbare praeprothetische botcorrecties, dubbelzijdig per kaak', points: 32, tariff: 240.05, toelichting: 'Inclusief hechten en wondtoilet.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'P', roman: 'XI', name: 'Kunstgebitten',
    subcategories: [
      {
        name: 'A: Gedeeltelijk kunstgebit',
        codes: [
          { code: 'P001', description: 'Gedeeltelijk kunstgebit van kunsthars, 1-4 elementen, per kaak', points: 15, tariff: 112.53, toelichting: 'Vanaf eerste consultatie tot en met plaatsing, inclusief nazorg gedurende vier maanden na plaatsing. Per kaak.', requiresTooth: false, requiresSurface: false },
          { code: 'P002', description: 'Gedeeltelijk kunstgebit van kunsthars, 5-13 elementen, per kaak', points: 30, tariff: 225.05, toelichting: 'Vanaf eerste consultatie tot en met plaatsing, inclusief nazorg gedurende vier maanden na plaatsing. Per kaak.', requiresTooth: false, requiresSurface: false },
          { code: 'P003', description: 'Frame kunstgebit, 1-4 elementen, per kaak', points: 41, tariff: 307.57, toelichting: 'Vanaf eerste consultatie tot en met plaatsing, inclusief nazorg gedurende vier maanden. Inclusief ontwerp en steunen inslijpen.', requiresTooth: false, requiresSurface: false },
          { code: 'P004', description: 'Frame kunstgebit, 5-13 elementen, per kaak', points: 56, tariff: 420.10, toelichting: 'Vanaf eerste consultatie tot en met plaatsing, inclusief nazorg gedurende vier maanden. Inclusief ontwerp en steunen inslijpen.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B: Volledig kunstgebit',
        codes: [
          { code: 'P020', description: 'Volledig kunstgebit bovenkaak', points: 30, tariff: 225.05, toelichting: 'Vanaf eerste consultatie tot en met plaatsing, inclusief nazorg gedurende vier maanden na plaatsing.', requiresTooth: false, requiresSurface: false },
          { code: 'P021', description: 'Volledig kunstgebit onderkaak', points: 40, tariff: 300.07, toelichting: 'Vanaf eerste consultatie tot en met plaatsing, inclusief nazorg gedurende vier maanden na plaatsing.', requiresTooth: false, requiresSurface: false },
          { code: 'P022', description: 'Volledig kunstgebit boven- en onderkaak', points: 65, tariff: 487.61, toelichting: 'Vanaf eerste consultatie tot en met plaatsing, inclusief nazorg gedurende vier maanden na plaatsing.', requiresTooth: false, requiresSurface: false },
          { code: 'P023', description: 'Tijdelijk volledig kunstgebit, per kaak', points: 20, tariff: 150.03, toelichting: 'Tijdelijk volledig kunstgebit ter overbrugging van de periode tot plaatsing van een niet tijdelijke prothetische voorziening.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'C: Toeslagen',
        codes: [
          { code: 'P040', description: 'Toeslag voor individuele afdruk bij volledig kunstgebit', points: 10.8, tariff: 81.02, toelichting: 'Per kaak in rekening te brengen. Toeslag bij P020, P021, P022 en P023.', requiresTooth: false, requiresSurface: false },
          { code: 'P041', description: 'Toeslag voor individuele afdruk bij gedeeltelijk kunstgebit van kunsthars', points: 5, tariff: 37.51, toelichting: 'Per kaak in rekening te brengen. Toeslag bij P001 en P002.', requiresTooth: false, requiresSurface: false },
          { code: 'P042', description: 'Toeslag voor beetregistratie met specifieke apparatuur', points: 10, tariff: 75.02, toelichting: 'Toeslag om met specifieke apparatuur te bepalen hoe de kaken ten opzichte van elkaar staan. Toeslag bij P020 en P022.', requiresTooth: false, requiresSurface: false },
          { code: 'P043', description: 'Toeslag voor frontopstelling en/of beetbepaling in aparte zitting', points: 6, tariff: 45.01, toelichting: 'Toeslag voor het in een aparte zitting opstellen van de voortanden en/of beetbepalen en aanpassen lip- en wangvulling.', requiresTooth: false, requiresSurface: false },
          { code: 'P044', description: 'Toeslag zeer ernstig geslonken kaak, per kaak', points: 13.5, tariff: 101.27, toelichting: 'Toeslag indien bij de patient een klikgebit is geindiceerd, maar een volledig kunstgebit wordt geplaatst. Per kaak.', requiresTooth: false, requiresSurface: false },
          { code: 'P045', description: 'Toeslag immediaat kunstgebit', points: 2.5, tariff: 18.75, toelichting: 'Per immediaat te vervangen element in rekening te brengen met een maximum van 8 elementen per kaak. Exclusief extracties en opvullen.', requiresTooth: false, requiresSurface: false },
          { code: 'P046', description: 'Toeslag voor elk element bij een overkappingskunstgebit', points: 8, tariff: 60.01, toelichting: 'Toeslag voor elke natuurlijke wortel waar een kunstgebit over heen wordt geplaatst. Inclusief afprepareren, vullen en polijsten.', requiresTooth: true, requiresSurface: false },
          { code: 'P047', description: 'Toeslag voor gegoten anker bij gedeeltelijk kunstgebit van kunsthars', points: 3, tariff: 22.51, toelichting: 'Toeslag voor het extra bevestigen van een gedeeltelijk kunstgebit met een gegoten anker. Toeslag bij P001 en P002.', requiresTooth: false, requiresSurface: false },
          { code: 'P048', description: 'Toeslag voor maken precisiekoppeling, per koppeling of staafhuls', points: 15, tariff: 112.53, toelichting: 'Toeslag voor het maken van een precisiekoppeling om het kunstgebit te laten steunen op de resterende tanden en kiezen.', requiresTooth: false, requiresSurface: false },
          { code: 'P049', description: 'Toeslag voor aanbrengen telescoopkroon met precisiekoppeling', points: 10, tariff: 75.02, toelichting: 'Toeslag voor het aanbrengen van een kap kroon in een frame- of overkappingskunstgebit voor extra steun en houvast.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'D: Aanpassingen bestaand kunstgebit',
        codes: [
          { code: 'P060', description: 'Tissue conditioning volledig kunstgebit, per kaak', points: 7, tariff: 52.51, toelichting: 'Het aanbrengen van tijdelijke weekblijvende laag aan de binnenzijde van een bestaand volledig kunstgebit. Per kaak.', requiresTooth: false, requiresSurface: false },
          { code: 'P061', description: 'Tissue conditioning gedeeltelijk kunstgebit van kunsthars of framekunstgebit, per kaak', points: 7, tariff: 52.51, toelichting: 'Het aanbrengen van tijdelijke weekblijvende laag aan de binnenzijde van een bestaand gedeeltelijk kunstgebit. Per kaak.', requiresTooth: false, requiresSurface: false },
          { code: 'P062', description: 'Opvullen volledig kunstgebit, indirect, per kaak', points: 14.1, tariff: 105.77, toelichting: 'Het door middel van een afdruk opvullen van een volledig kunstgebit met nieuwe kunsthars, zodat het weer goed aansluit.', requiresTooth: false, requiresSurface: false },
          { code: 'P063', description: 'Opvullen volledig kunstgebit, direct, per kaak', points: 14.2, tariff: 106.52, toelichting: 'Opvullen van een volledig kunstgebit direct met kunsthars in de mond zodat het weer goed aansluit.', requiresTooth: false, requiresSurface: false },
          { code: 'P064', description: 'Opvullen gedeeltelijk kunstgebit van kunsthars of framekunstgebit, indirect, per kaak', points: 12.3, tariff: 92.27, toelichting: 'Het door middel van een afdruk opvullen van een gedeeltelijk kunstgebit met nieuwe kunsthars.', requiresTooth: false, requiresSurface: false },
          { code: 'P065', description: 'Opvullen gedeeltelijk kunstgebit van kunsthars of framekunstgebit, direct, per kaak', points: 12.8, tariff: 96.02, toelichting: 'Opvullen van een gedeeltelijk kunstgebit direct met kunsthars in de mond.', requiresTooth: false, requiresSurface: false },
          { code: 'P066', description: 'Opvullen overkappingskunstgebit op natuurlijke pijlers zonder staafdemontage, per kaak', points: 28, tariff: 210.05, toelichting: 'Het opvullen van een overkappingskunstgebit op staaf-huls op natuurlijke wortels met nieuwe kunsthars.', requiresTooth: false, requiresSurface: false },
          { code: 'P067', description: 'Planmatig inslijpen bestaand kunstgebit', points: 5, tariff: 37.51, toelichting: 'Het inslijpen van tanden en kiezen van een bestaand kunstgebit voor bilateraal gebalanceerde occlusie en articulatie.', requiresTooth: false, requiresSurface: false },
          { code: 'P068', description: 'Reparatie volledig kunstgebit, zonder afdruk, per kaak', points: 3, tariff: 22.51, toelichting: 'Per kaak in rekening te brengen.', requiresTooth: false, requiresSurface: false },
          { code: 'P069', description: 'Reparatie volledig kunstgebit, met afdruk, per kaak', points: 8, tariff: 60.01, toelichting: 'Per kaak in rekening te brengen.', requiresTooth: false, requiresSurface: false },
          { code: 'P070', description: 'Reparatie gedeeltelijk kunstgebit van kunsthars of framekunstgebit, zonder afdruk, per kaak', points: 3, tariff: 22.51, toelichting: 'Per kaak in rekening te brengen.', requiresTooth: false, requiresSurface: false },
          { code: 'P071', description: 'Reparatie en/of uitbreiding gedeeltelijk kunstgebit van kunsthars of framekunstgebit, met afdruk, per kaak', points: 8, tariff: 60.01, toelichting: 'Per kaak in rekening te brengen. Bij uitbreiding geldt dit vanaf eerste consultatie tot en met plaatsing inclusief nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'P072', description: 'Uitbreiding gedeeltelijk kunstgebit van kunsthars of frame kunstgebit met element(en) tot volledig kunstgebit, met afdruk, per kaak', points: 8, tariff: 60.01, toelichting: 'Het aanvullen van een gedeeltelijk kunstgebit met tanden en kiezen zodat het een volledig kunstgebit wordt. Per kaak.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'T', roman: 'XII', name: 'Tandvleesbehandelingen',
    subcategories: [
      {
        name: 'A: Verrichtingen bij patienten met tandvleesaandoeningen',
        codes: [
          { code: 'T012', description: 'Onderzoek van het tandvlees met parodontiumstatus', points: 29, tariff: 217.55, toelichting: 'Ongeacht het aantal zittingen. Maximumtarief voor parodontaal onderzoek inclusief informatie en voorlichting mondhygiene.', requiresTooth: false, requiresSurface: false },
          { code: 'T021', description: 'Grondig reinigen wortel, complex', points: 5.4, tariff: 40.51, toelichting: 'Reiniging element, exclusief verdoving. Voor behandeling van eenwortelig element met pockets >=8 mm of meerwortelig element met pockets >= 6 mm.', requiresTooth: true, requiresSurface: false },
          { code: 'T022', description: 'Grondig reinigen wortel, standaard', points: 4, tariff: 30.01, toelichting: 'Reiniging element, exclusief verdoving. Voor behandeling van eenwortelig element met pockets 4-7 mm of meerwortelig element met pockets 4-5 mm.', requiresTooth: true, requiresSurface: false },
          { code: 'T032', description: 'Evaluatie initiele behandeling/chirurgie of herbeoordeling met parodontiumstatus', points: 18, tariff: 135.03, toelichting: 'Toe te passen bij evaluatie na initiele behandeling/chirurgie of als periodiek herbeoordelingsonderzoek. Ongeacht het aantal zittingen.', requiresTooth: false, requiresSurface: false },
          { code: 'T033', description: 'Bespreken vervolgtraject na evaluatie of herbeoordeling', points: 11, tariff: 82.52, toelichting: 'Het vaststellen van het parodontaal vervolgtraject en het bespreken daarvan met de patient. Uitsluitend in combinatie met T032.', requiresTooth: false, requiresSurface: false },
          { code: 'T042', description: 'Consult parodontale nazorg', points: 15.2, tariff: 114.03, toelichting: 'Van toepassing als nazorg na evaluatie initiele behandeling/chirurgie of herbeoordeling met parodontiumstatus (T032).', requiresTooth: false, requiresSurface: false },
          { code: 'T043', description: 'Uitgebreid consult parodontale nazorg', points: 20.2, tariff: 151.53, toelichting: 'Van toepassing als nazorg na evaluatie initiele behandeling/chirurgie of herbeoordeling met parodontiumstatus (T032). Bij uitgebreid consult.', requiresTooth: false, requiresSurface: false },
          { code: 'T044', description: 'Complex consult parodontale nazorg', points: 26.9, tariff: 201.80, toelichting: 'Van toepassing als nazorg na evaluatie. Gelijk aan uitgebreid consult (T043) maar met aanwezigheid van complicerende factoren.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'A.1: Parodontale chirurgie',
        codes: [
          { code: 'T070', description: 'Flapoperatie tussen twee elementen', points: 32.5, tariff: 243.81, toelichting: 'Inclusief voorbereiding praktijkruimte en patient, verdoving, flapoperatie, instrueren en operatieverslag.', requiresTooth: false, requiresSurface: false },
          { code: 'T071', description: 'Flapoperatie per sextant (een zesde deel)', points: 50, tariff: 375.09, toelichting: 'Inclusief voorbereiding praktijkruimte en patient, verdoving, flapoperatie, instrueren en operatieverslag.', requiresTooth: false, requiresSurface: false },
          { code: 'T072', description: 'Flapoperatie uitgebreid per sextant (een zesde deel)', points: 60, tariff: 450.10, toelichting: 'Inclusief eventueel gelijktijdig uitgevoerde vestibulumverdieping. Bij ontstoken pockets dieper dan 6 mm met complicerende factoren.', requiresTooth: false, requiresSurface: false },
          { code: 'T073', description: 'Directe postoperatieve zorg, eerste zitting', points: 10, tariff: 75.02, toelichting: 'Eerste controlezitting na de chirurgische ingreep. Inclusief controleren wondgenezing en verwijderen hechtingen.', requiresTooth: false, requiresSurface: false },
          { code: 'T074', description: 'Directe postoperatieve zorg, volgende zitting', points: 26.9, tariff: 201.80, toelichting: 'Per zitting in rekening te brengen. Inclusief controleren wondgenezing, verwijderen plaque en tandsteen, instructie mondhygiene.', requiresTooth: false, requiresSurface: false },
          { code: 'T076', description: 'Tuber- of retromolaarplastiek', points: 12.5, tariff: 93.77, toelichting: 'Uitsluitend in combinatie met T070, T071 en T072 in hetzelfde sextant. Als zelfstandige verrichting is T101 aangewezen.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B: Parodontologie in overige situaties',
        codes: [
          { code: 'T101', description: 'Tuber- of retromolaarplastiek', points: 17.5, tariff: 131.28, toelichting: 'Als zelfstandige verrichting, niet in combinatie met flapoperatie. Inclusief voorbereiding, verdoving en instructie mondhygiene.', requiresTooth: false, requiresSurface: false },
          { code: 'T102', description: 'Tandvleescorrectie, een element', points: 9.5, tariff: 71.27, toelichting: 'Inclusief voorbereiding praktijkruimte, verdoving en instructie mondhygiene. Bij twee t/m zes elementen is T103 aangewezen.', requiresTooth: true, requiresSurface: false },
          { code: 'T103', description: 'Tandvleescorrectie, bij twee t/m zes elementen', points: 25, tariff: 187.54, toelichting: 'Inclusief voorbereiding praktijkruimte, verdoving en instructie mondhygiene.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.2: Toepassen van regeneratietechniek',
        codes: [
          { code: 'T111', description: 'Aanbrengen parodontaal regeneratiemateriaal voor botherstel als zelfstandige verrichting, per sextant', points: 60, tariff: 450.10, toelichting: 'Ongeacht het aantal elementen per sextant. Inclusief voorbereiding, verdoving en instructie. Materialen apart in rekening.', requiresTooth: false, requiresSurface: false },
          { code: 'T112', description: 'Aanbrengen parodontaal regeneratiemateriaal voor botherstel als niet-zelfstandige verrichting, gelijktijdig met flapoperatie, per element', points: 20, tariff: 150.03, toelichting: 'Extra te berekenen naast het tarief van flapoperatie. Uitsluitend in combinatie met T070, T071, T072, J048.', requiresTooth: true, requiresSurface: false },
          { code: 'T113', description: 'Operatieve verwijdering van regeneratiemateriaal', points: 32.5, tariff: 243.81, toelichting: 'Inclusief voorbereiding praktijkruimte, verdoving en instructie mondhygiene.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.3: Parodontale kroonverlengingsprocedure',
        codes: [
          { code: 'T121', description: 'Kroonverlenging, een element', points: 32.5, tariff: 243.81, toelichting: 'Flapoperatie inclusief correctie cervicale botniveau als voorbehandeling voor latere restauratie. Inclusief voorbereiding en verdoving.', requiresTooth: true, requiresSurface: false },
          { code: 'T122', description: 'Kroonverlenging, bij twee t/m zes elementen', points: 60, tariff: 450.10, toelichting: 'Flapoperatie inclusief correctie cervicale botniveau als voorbehandeling voor latere restauratie. Inclusief voorbereiding en verdoving.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.4: Mucogingivale chirurgie',
        codes: [
          { code: 'T141', description: 'Tandvleestransplantaat', points: 19, tariff: 142.53, toelichting: 'Gingivatransplantaat. Weefseltransplantaat van palatumgingiva. Inclusief verdoving en instructie mondhygiene.', requiresTooth: false, requiresSurface: false },
          { code: 'T142', description: 'Recessie bedekking met verplaatste lap', points: 60, tariff: 450.10, toelichting: 'Tandvlees/slijmvlies chirurgie met verplaatsing van een mucogingivale lap. Ongeacht het aantal elementen per sextant.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.5: Directe postoperatieve zorg',
        codes: [
          { code: 'T151', description: 'Directe postoperatieve zorg, eerste zitting', points: 10, tariff: 75.02, toelichting: 'Eerste controlezitting na de chirurgische ingreep. Inclusief controleren wondgenezing en verwijderen hechtingen.', requiresTooth: false, requiresSurface: false },
          { code: 'T152', description: 'Directe postoperatieve zorg, volgende zitting', points: 26.9, tariff: 201.80, toelichting: 'Per zitting in rekening te brengen. Inclusief controleren wondgenezing, plaque en tandsteen verwijderen, instructie mondhygiene.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B.6: Diversen',
        codes: [
          { code: 'T161', description: 'Bacteriologisch onderzoek ten behoeve van tandvleesbehandeling', points: 7, tariff: 52.51, toelichting: 'Het afnemen van een gelokaliseerde parostatus en het nemen van minimaal drie plaquemonsters, inclusief bespreking. Niet in combinatie met M32.', requiresTooth: false, requiresSurface: false },
          { code: 'T162', description: 'Behandeling tandvleesabces', points: 13.5, tariff: 101.27, toelichting: 'Onderzoek, verdoving en rootplanen, inclusief instructie mondhygiene en vervangende maatregelen.', requiresTooth: false, requiresSurface: false },
          { code: 'T163', description: 'Toepassing lokaal medicament', points: 10.8, tariff: 81.02, toelichting: 'Per zitting eenmaal te declareren, ongeacht het aantal elementen. Medicamenten als materiaal- en techniekkosten apart.', requiresTooth: false, requiresSurface: false },
          { code: 'T164', description: '(Draad)Spalk', points: 4, tariff: 30.01, toelichting: 'Het spalken van parodontaal aangedane mobiele elementen. Te declareren per verbinding, inclusief etsen.', requiresTooth: true, requiresSurface: false },
          { code: 'T165', description: 'Uitgebreide voedingsanalyse', points: 10, tariff: 75.02, toelichting: 'Op basis van een door de patient bijgehouden schriftelijk verslag over eetgewoonten inclusief bespreking. Enkel als onderdeel van parodontale behandeling.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'J', roman: 'XIII', name: 'Implantaten',
    subcategories: [
      {
        name: 'Overheadkosten',
        codes: [
          { code: 'J001', description: 'Overheadkosten implantaten, autotransplantaten en peri-implantitis chirurgie', points: null, tariff: 217.86, toelichting: 'Eenmalig per implantaat, autotransplantaat of peri-implantitis behandeling per kaak in rekening te brengen bij J040, J046, J048, H38, U05, U25 en U35.', requiresTooth: false, requiresSurface: false },
          { code: 'J002', description: 'Overheadkosten pre-implantologische chirurgie', points: null, tariff: 123.30, toelichting: 'Eenmalig per implantaatbehandeling per kaak in rekening te brengen bij J020, J022, U05, U25 en U35.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'A: Onderzoek, diagnostiek en behandelplanning',
        codes: [
          { code: 'J010', description: 'Onderzoek ten behoeve van de indicatiestelling voor de implantologische behandeling', points: 13, tariff: 97.52, toelichting: 'Ongeacht het aantal zittingen. Onderzoek, voorlichting en globale beoordeling of implantologie is geindiceerd.', requiresTooth: false, requiresSurface: false },
          { code: 'J011', description: 'Onderzoek ten behoeve van de uitvoering van de implantologische behandeling', points: 20, tariff: 150.03, toelichting: 'Ongeacht het aantal zittingen. Eenmaal per implantaatbehandeling. Inclusief anamnese, botmetingen, diagnostiek en behandelplan.', requiresTooth: false, requiresSurface: false },
          { code: 'J012', description: 'Proefopstelling implantologie, 1-4 elementen', points: 15, tariff: 112.53, toelichting: 'Per kaak in rekening te brengen. Proefopstelling van 1-4 elementen ter indicatie voor het onderzoek of vaste prothetiek mogelijk is.', requiresTooth: false, requiresSurface: false },
          { code: 'J013', description: 'Proefopstelling implantologie 5 of meer elementen', points: 30, tariff: 225.05, toelichting: 'Per kaak in rekening te brengen. Proefopstelling van 5 of meer elementen inclusief digitale afdrukken en beetrelatie.', requiresTooth: false, requiresSurface: false },
          { code: 'J014', description: 'Implantaatpositionering op grond van CT-scan', points: 9, tariff: 67.52, toelichting: 'Eenmaal per implantaatbehandeling. Vastleggen van type implantaat, lengte, doorsnede, richting en diepte. Inclusief bespreking.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'B: Technieken voor het vergroten van het botvolume in een aparte zitting',
        codes: [
          { code: 'J020', description: 'Ophoging bodem bijholte in een aparte zitting voorafgaand aan het implanteren, eerste kaakhelft', points: 48, tariff: 360.08, toelichting: 'Eenmaal per kaakhelft per implantaatbehandeling. Sinusbodemelevatie met autoloog bot en/of botvervangend materiaal.', requiresTooth: false, requiresSurface: false },
          { code: 'J021', description: 'Ophoging bodem bijholte in een aparte zitting, tweede kaakhelft binnen een termijn van drie maanden', points: 30, tariff: 225.05, toelichting: 'Eenmaal per kaakhelft. In rekening te brengen indien sprake is van een ophoging van de tweede kaakhelft binnen drie maanden na J020.', requiresTooth: false, requiresSurface: false },
          { code: 'J022', description: 'Kaakverbreding en/of verhoging in een aparte zitting voorafgaand aan het implanteren, per kaak', points: 29, tariff: 217.55, toelichting: 'Aanbrengen van autoloog bot en/of botvervangend materiaal voor het in hoogte en/of breedte uitbouwen van de kaak.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'C: Technieken voor het vergroten van het botvolume in dezelfde zitting als het implanteren',
        codes: [
          { code: 'J030', description: 'Kaakverbreding en/of verhoging, per sextant, tijdens het implanteren', points: 17, tariff: 127.53, toelichting: 'Per sextant in rekening te brengen. Aanbrengen van autoloog bot en/of botvervangend materiaal in dezelfde zitting als het implanteren.', requiresTooth: false, requiresSurface: false },
          { code: 'J031', description: 'Ophoging bodem bijholte, tijdens het implanteren', points: 26, tariff: 195.04, toelichting: 'Per kaakhelft in rekening te brengen. Sinusbodemelevatie in dezelfde zitting als het plaatsen van het implantaat.', requiresTooth: false, requiresSurface: false },
          { code: 'J032', description: 'Ophoging bodem bijholte orthograad, tijdens het implanteren', points: 12, tariff: 90.02, toelichting: 'Aanbrengen van autoloog bot en/of botvervangend materiaal door het implantatie-boorgat in dezelfde zitting. Alleen in combinatie met J040, J041, J046 of J047.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'D: Implantologische chirurgie',
        codes: [
          { code: 'J040', description: 'Plaatsen eerste implantaat, per kaak', points: 45.8, tariff: 343.58, toelichting: 'Het plaatsen van het eerste implantaat in de onder- of bovenkaak. Indien van toepassing inclusief het vrijleggen van de foramen mentale.', requiresTooth: false, requiresSurface: false },
          { code: 'J041', description: 'Plaatsen volgend implantaat in dezelfde kaak', points: 18.9, tariff: 141.78, toelichting: 'Het plaatsen van het tweede of volgende implantaat in dezelfde kaak. Uitsluitend in combinatie met J040 of J046.', requiresTooth: false, requiresSurface: false },
          { code: 'J042', description: 'Plaatsen eerste tandvleesvormer', points: 15, tariff: 112.53, toelichting: 'Het plaatsen van een eerste tandvleesvormer zoals een healing abutment of multi-unit abutment. Alleen bij twee fase techniek.', requiresTooth: false, requiresSurface: false },
          { code: 'J043', description: 'Plaatsen volgende tandvleesvormer', points: 7.1, tariff: 53.26, toelichting: 'Het plaatsen van een volgende tandvleesvormer. Uitsluitend in combinatie met J041 of J042 in rekening te brengen.', requiresTooth: false, requiresSurface: false },
          { code: 'J044', description: 'Verwijderen implantaat', points: 6.6, tariff: 49.51, toelichting: 'Inclusief hechten en wondtoilet. Niet in rekening te brengen binnen zes maanden na plaatsing op dezelfde locatie.', requiresTooth: false, requiresSurface: false },
          { code: 'J045', description: 'Moeizaam verwijderen implantaat', points: 33, tariff: 247.56, toelichting: 'Het opklappen van het tandvlees en zo nodig verwijderen van bot inclusief hechten en wondtoilet. Niet binnen zes maanden na plaatsing.', requiresTooth: false, requiresSurface: false },
          { code: 'J046', description: 'Vervangen eerste implantaat', points: 45.7, tariff: 342.83, toelichting: 'Vervanging van een eerder verloren gegaan implantaat. Inclusief operatie, nazorg en indien van toepassing vrijleggen foramen mentale.', requiresTooth: false, requiresSurface: false },
          { code: 'J047', description: 'Vervangen volgend implantaat', points: 18.9, tariff: 141.78, toelichting: 'Vervanging van een eerder verloren gegaan implantaat. Uitsluitend in combinatie met J046 in rekening te brengen.', requiresTooth: false, requiresSurface: false },
          { code: 'J048', description: 'Chirurgische behandeling peri-implantitis, per sextant', points: 34.9, tariff: 261.81, toelichting: 'Chirurgische behandeling van peri-implantitis. Inclusief instructie en/of voorlichting mondhygiene.', requiresTooth: false, requiresSurface: false },
          { code: 'J049', description: 'Plaatsen van twee implantaten in de tandeloze onderkaak voor een klikgebit', points: 101.9, tariff: 764.42, toelichting: 'Gehele behandeltraject inclusief diagnostiek, indicatiestelling, plaatsen van twee implantaten en nazorg gedurende zes maanden.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'E: Diversen',
        codes: [
          { code: 'J050', description: 'Toeslag voor de kosten van boren voor eenmalig gebruik en/of inzetstukken van een Implant Removal Set', points: null, tariff: null, toelichting: 'Boren en borstels kunnen tegen kostprijs in rekening worden gebracht. Alleen in combinatie met J040, J046, J048, J049, J052, H38, U05, U25 en U35.', requiresTooth: false, requiresSurface: false },
          { code: 'J051', description: 'Aanbrengen botvervangers in extractie wond', points: 4, tariff: 30.01, toelichting: 'Granulaat of ander niet-lichaamseigen materiaal te plaatsen in de extractie-alveole om slinken van de kaakwal tegen te gaan.', requiresTooth: true, requiresSurface: false },
          { code: 'J052', description: 'Prepareren donorplaats', points: 27, tariff: 202.55, toelichting: 'Vrijleggen van het bot op de donorplaats voor het verkrijgen van autoloog bottransplantaat. Uitsluitend in combinatie met J020, J021 en/of J022, J030, J031 of J032.', requiresTooth: false, requiresSurface: false },
          { code: 'J053', description: 'Toeslag esthetische zone, per kaakhelft', points: 13.5, tariff: 101.27, toelichting: 'Per kaakhelft in rekening te brengen. Toeslag voor extra chirurgische handelingen noodzakelijk in de esthetische zone (element 14 tot en met 24).', requiresTooth: false, requiresSurface: false },
          { code: 'J054', description: 'Bindweefseltransplantaat per donorplaats', points: 21, tariff: 157.54, toelichting: 'Het transplanteren van bindweefsel uit een andere donorplaats in de mond naar een plek waar een implantaat zit om het tandvlees dikker en steviger te maken.', requiresTooth: false, requiresSurface: false },
          { code: 'J055', description: 'Verkrijgen en verwerken van bloed tot een regeneratief biomateriaal middels een venapunctie', points: 22.5, tariff: 168.79, toelichting: 'Per zitting. Het verkrijgen van Platelet Rich Fibrin (PRF) middels venapunctie, centrifugeren en verder verwerken voor weefselregeneratie.', requiresTooth: false, requiresSurface: false },
          { code: 'J056', description: 'Verwijderen gefractureerd abutment/occlusale schroef', points: 23, tariff: 172.54, toelichting: 'Verwijderen en vervanging van een gebroken abutment of schroef. Geldt per implantaat. Niet binnen zes maanden na plaatsing van het abutment.', requiresTooth: false, requiresSurface: false },
          { code: 'J057', description: 'Kosten implantaat', points: null, tariff: 424.64, toelichting: 'Kosten van het implantaat inclusief afdekschroefje (cover screw) of tandvleesvormer. Uitsluitend bij J040, J041, J046, J047, J049, U05, U25 en U35.', requiresTooth: false, requiresSurface: false },
          { code: 'J058', description: 'Bepaling stabiliteit implantaat middels ISQ-meting', points: 2, tariff: 15.00, toelichting: 'Eenmaal per implantaat per implantaatbehandeling in rekening te brengen.', requiresTooth: false, requiresSurface: false },
          { code: 'J059', description: 'Grondig submucosaal reinigen implantaat', points: 4.7, tariff: 35.26, toelichting: 'Per implantaat. Het grondig reinigen van het implantaat onder het tandvlees. Voor behandeling van peri-implantitis.', requiresTooth: false, requiresSurface: false },
          { code: 'J060', description: 'Tijdelijke kroon in dezelfde zitting op immediaat geplaatst implantaat', points: 52, tariff: 390.09, toelichting: 'Alleen van toepassing in de esthetische zone (element 14 tot en met 24). Vervaardigen en plaatsen van een tijdelijke restauratie op een immediaat geplaatst implantaat.', requiresTooth: false, requiresSurface: false },
          { code: 'J061', description: 'Toeslag zygoma-implantaat t.b.v. planning, proefopstelling en uitvoering', points: 15, tariff: 112.53, toelichting: 'Per zygoma-implantaat. Uitsluitend in combinatie met J040 en indien van toepassing J041.', requiresTooth: false, requiresSurface: false },
          { code: 'J062', description: 'Kosten zygoma-implantaat', points: null, tariff: 637.81, toelichting: 'Deze prestatie kan niet in combinatie met J057 op hetzelfde element in rekening worden gebracht.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'F: Mesostructuur',
        codes: [
          { code: 'J070', description: 'Plaatsen eerste drukknop', points: 24, tariff: 180.04, toelichting: 'Inclusief het aanbrengen van abutments.', requiresTooth: false, requiresSurface: false },
          { code: 'J071', description: 'Plaatsen elke volgende drukknop', points: 7, tariff: 52.51, toelichting: 'In rekening te brengen voor elke volgende drukknop in dezelfde kaak in dezelfde constructie. Uitsluitend in combinatie met J070.', requiresTooth: false, requiresSurface: false },
          { code: 'J072', description: 'Staaf tussen twee implantaten in dezelfde kaak', points: 41, tariff: 307.57, toelichting: 'Per kaak. Tarief voor de gehele constructie, inclusief het aanbrengen van abutments.', requiresTooth: false, requiresSurface: false },
          { code: 'J073', description: 'Elke volgende staaf tussen implantaten in dezelfde kaak', points: 13, tariff: 97.52, toelichting: 'Per kaak. In dezelfde kaak, volgend op J072.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'G: Prothetische behandeling na implantaten',
        codes: [
          { code: 'J080', description: 'Gelijktijdig plaatsen volledig kunstgebit en klikgebit', points: 103, tariff: 772.68, toelichting: 'Vervaardiging van een klikgebit met gelijktijdige vervaardiging van een kunstgebit op de andere kaak. Ook als vervangingsprothese.', requiresTooth: false, requiresSurface: false },
          { code: 'J081', description: 'Klikgebit in de onderkaak', points: 67, tariff: 502.61, toelichting: 'Vervaardiging van uitsluitend een klikgebit in de onderkaak op een mesostructuur. Ook als vervangingsprothese.', requiresTooth: false, requiresSurface: false },
          { code: 'J082', description: 'Klikgebit in de bovenkaak', points: 67, tariff: 502.61, toelichting: 'Vervaardiging van uitsluitend een klikgebit in de bovenkaak op een mesostructuur. Ook als vervangingsprothese.', requiresTooth: false, requiresSurface: false },
          { code: 'J083', description: 'Omvorming tot klikgebit', points: 20, tariff: 150.03, toelichting: 'Per kaak. Omvorming van een bestaande prothetische voorziening tot prothetische voorziening op drukknoppen. Exclusief mesostructuur.', requiresTooth: false, requiresSurface: false },
          { code: 'J084', description: 'Omvorming tot klikgebit bij staven tussen twee implantaten', points: 26, tariff: 195.04, toelichting: 'Per kaak. Omvorming van een bestaande prothetische voorziening tot voorziening op staven. Exclusief mesostructuur.', requiresTooth: false, requiresSurface: false },
          { code: 'J085', description: 'Omvorming tot klikgebit bij staven tussen drie of vier implantaten', points: 30, tariff: 225.05, toelichting: 'Per kaak. Omvorming van bestaande prothetische voorziening tot voorziening op staven. Exclusief mesostructuur.', requiresTooth: false, requiresSurface: false },
          { code: 'J086', description: 'Omvorming tot klikgebit bij staven tussen meer dan vier implantaten', points: 35, tariff: 262.56, toelichting: 'Per kaak. Omvorming van bestaande prothetische voorziening tot voorziening op staven. Exclusief mesostructuur.', requiresTooth: false, requiresSurface: false },
          { code: 'J087', description: 'Toeslag vervangingsklikgebit op bestaande staven tussen twee implantaten', points: 17, tariff: 127.53, toelichting: 'Per kaak. Vervaardiging klikgebit op bestaande staven. Uitsluitend in combinatie met J080, J081 of J082.', requiresTooth: false, requiresSurface: false },
          { code: 'J088', description: 'Toeslag vervangingsklikgebit op bestaande staven tussen drie of vier implantaten', points: 22, tariff: 165.04, toelichting: 'Per kaak. Vervaardiging klikgebit op bestaande staven. Uitsluitend in combinatie met J080, J081 of J082.', requiresTooth: false, requiresSurface: false },
          { code: 'J089', description: 'Toeslag vervangingsklikgebit op bestaande staven tussen meer dan vier implantaten', points: 27, tariff: 202.55, toelichting: 'Per kaak. Vervaardiging klikgebit op bestaande staven. Uitsluitend in combinatie met J080, J081 of J082.', requiresTooth: false, requiresSurface: false },
          { code: 'J180', description: 'Gedeeltelijk klikgebit van kunststof', points: null, tariff: 225.05, toelichting: 'Per kaak in rekening te brengen. Vervaardiging van een gedeeltelijk klikgebit van kunststof op een mesostructuur. Ook als vervangingsprothese.', requiresTooth: false, requiresSurface: false },
          { code: 'J181', description: 'Gedeeltelijk klikgebit met metalen basis (frame)', points: null, tariff: 420.10, toelichting: 'Per kaak in rekening te brengen. Vervaardiging van een gedeeltelijk klikgebit met metalen basis op een mesostructuur. Ook als vervangingsprothese.', requiresTooth: false, requiresSurface: false },
          { code: 'J183', description: 'Omvorming van gedeeltelijk kunstgebit of frame tot gedeeltelijk klikgebit', points: 20, tariff: 150.03, toelichting: 'Per kaak. Omvorming van een bestaande gedeeltelijke prothetische voorziening tot gedeeltelijk klikgebit op een mesostructuur. Exclusief mesostructuur.', requiresTooth: false, requiresSurface: false },
          { code: 'J184', description: 'Uitbreiding gedeeltelijk klikgebit tot (volledig) klikgebit, met afdruk, per kaak', points: null, tariff: 60.01, toelichting: 'Het aanvullen van een gedeeltelijk klikgebit met tanden en kiezen zodat het een volledig klikgebit wordt. Per kaak.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'H: Nazorg implantologie',
        codes: [
          { code: 'J090', description: 'Specifiek consult nazorg implantologie', points: 11, tariff: 82.52, toelichting: 'Periodieke controle met specifieke implantaatgebonden verrichtingen. Alleen te berekenen bij specifieke verdenking op pathologie.', requiresTooth: false, requiresSurface: false },
          { code: 'J091', description: 'Uitgebreid consult nazorg implantologie', points: 18, tariff: 135.03, toelichting: 'Periodieke controle met demontage van de mesostructuur. Inclusief demonteren en reinigen van abutments en opnieuw remonteren.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'I: Prothetische nazorg',
        codes: [
          { code: 'J100', description: 'Opvullen klikgebit zonder staafdemontage', points: 28, tariff: 210.05, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips of matrices van drukknoppen. Ongeacht het aantal implantaten.', requiresTooth: false, requiresSurface: false },
          { code: 'J101', description: 'Opvullen klikgebit met staafdemontage op twee implantaten', points: 35, tariff: 262.56, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips.', requiresTooth: false, requiresSurface: false },
          { code: 'J102', description: 'Opvullen klikgebit met staafdemontage op drie of vier implantaten', points: 40, tariff: 300.07, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips.', requiresTooth: false, requiresSurface: false },
          { code: 'J103', description: 'Opvullen klikgebit met staafdemontage op meer dan vier implantaten', points: 45, tariff: 337.58, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips.', requiresTooth: false, requiresSurface: false },
          { code: 'J104', description: 'Eenvoudige reparatie klikgebit zonder staafdemontage en zonder afdruk', points: null, tariff: 22.51, toelichting: 'Per kaak. Reparatie van het klikgebit zonder afdruk, bedoeld voor eenvoudige reparaties. Inclusief twee maanden nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'J105', description: 'Reparatie klikgebit zonder staafdemontage', points: 11, tariff: 82.52, toelichting: 'Per kaak. Reparatie waarvoor tenminste een afdruk, vervangen of repareren van clips nodig is. Inclusief twee maanden nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'J106', description: 'Reparatie klikgebit met staafdemontage op twee implantaten', points: 21, tariff: 157.54, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips. Inclusief twee maanden nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'J107', description: 'Reparatie klikgebit met staafdemontage op drie of vier implantaten', points: 26, tariff: 195.04, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips. Inclusief twee maanden nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'J108', description: 'Reparatie klikgebit met staafdemontage op meer dan vier implantaten', points: 31, tariff: 232.55, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips. Inclusief twee maanden nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'J109', description: 'Verwijderen en vervangen drukknop', points: 5, tariff: 37.51, toelichting: 'Per drukknop in rekening te brengen. Het verwijderen en vervangen van een drukknop (abutment).', requiresTooth: false, requiresSurface: false },
          { code: 'J110', description: 'Opvullen gedeeltelijk klikgebit', points: 28, tariff: 210.05, toelichting: 'Per kaak. Inclusief eventuele reparatie of vervanging van clips of matrices van drukknoppen. Ongeacht het aantal implantaten.', requiresTooth: false, requiresSurface: false },
          { code: 'J111', description: 'Eenvoudige reparatie gedeeltelijk klikgebit zonder afdruk', points: null, tariff: 22.51, toelichting: 'Per kaak. Reparatie van het gedeeltelijk klikgebit zonder afdruk, voor eenvoudige reparaties. Inclusief twee maanden nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'J112', description: 'Reparatie gedeeltelijk klikgebit', points: 11, tariff: 82.52, toelichting: 'Per kaak. Reparatie waarvoor tenminste een afdruk, vervangen of repareren van clips nodig is. Inclusief twee maanden nazorg.', requiresTooth: false, requiresSurface: false },
          { code: 'J113', description: 'Aanpassen huidige prothese tot tijdelijke voorziening ter verblokking zygoma-implantaten', points: 35, tariff: 262.56, toelichting: 'Ongeacht het aantal implantaten per kaak. Inclusief tandtechniek in eigen beheer. Voor toegepaste steg J072 en indien van toepassing J073.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'U', roman: 'XIV', name: 'Uurtarieven',
    subcategories: [
      {
        name: 'Uurtarieven ten behoeve van de bijzondere tandheelkunde en de Wlz',
        codes: [
          { code: 'U25', description: 'Tijdtarief tandheelkundige hulp aan patienten die behandeld worden in Wlz-instelling in eenheden van vijf minuten', points: null, tariff: 18.15, toelichting: 'Behandeling in het kader van tandheelkundige zorg voor patienten in een Wlz-instelling. Tarief per vijf werkbare minuten.', requiresTooth: false, requiresSurface: false },
          { code: 'U35', description: 'Tijdtarief tandheelkundige hulp aan patienten die verblijven in de Wlz-instelling en behandeld worden in de eigen praktijk', points: null, tariff: 20.94, toelichting: 'Behandeling buiten de Wlz-instelling in de eigen praktijk van de zorgaanbieder. Tarief per vijf minuten, per 1/12 deel stoeluur.', requiresTooth: false, requiresSurface: false },
          { code: 'U05', description: 'Tijdtarief begeleiding en behandeling moeilijk behandelbare patienten in eenheden van vijf minuten', points: null, tariff: 20.94, toelichting: 'Begeleiding en behandeling van bijzondere zorggroepen, bijvoorbeeld patienten met een verstandelijke en/of lichamelijke handicap of extreem angstige patienten. Per vijf minuten.', requiresTooth: false, requiresSurface: false },
          { code: 'U06', description: 'Extra tijd begeleiding moeilijk behandelbare patienten in eenheden van vijf minuten', points: null, tariff: 20.94, toelichting: 'Extra tijd voor begeleiding bij een behandeling van bijzondere zorggroepen. Niet te declareren in combinatie met U05.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'Y', roman: 'XV', name: 'Informatieverstrekking en onderlinge dienstverlening',
    subcategories: [
      {
        name: 'Informatieverstrekking',
        codes: [
          { code: 'Y01', description: 'Informatieverstrekking aan derden, per vijf minuten', points: null, tariff: 17.09, toelichting: 'Tarief per vijf minuten door de zorgverlener bestede tijd aan het verstrekken van informatie aan derden, inclusief bijbehorende rapportage.', requiresTooth: false, requiresSurface: false },
          { code: 'Y02', description: 'Onderlinge dienstverlening', points: null, tariff: null, toelichting: 'De levering van (onderdelen van) prestaties tandheelkundige zorg door een zorgaanbieder in opdracht van een andere zorgaanbieder. Maximumtarief van toepassing.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
  {
    code: 'F', roman: 'XVI', name: 'Orthodontie',
    subcategories: [
      {
        name: 'I: Consultatie en diagnostiek',
        codes: [
          { code: 'F121', description: 'Eerste consult', points: null, tariff: 28.51, toelichting: 'Eenvoudig diagnostisch onderzoek om tot een voorlopige diagnose te komen. Exclusief rontgenonderzoek en gebitsmodellen.', requiresTooth: false, requiresSurface: false },
          { code: 'F122', description: 'Herhaalconsult', points: null, tariff: 28.51, toelichting: 'Eenvoudig diagnostisch onderzoek om tot een voorlopige diagnose te komen, indien uit F121 blijkt dat nog niet tot behandeling kan worden overgegaan.', requiresTooth: false, requiresSurface: false },
          { code: 'F123', description: 'Controlebezoek', points: null, tariff: 27.28, toelichting: 'Indien tijdens een aangevangen behandeling met apparatuur wordt besloten om deze enige tijd te onderbreken en de patient geen apparatuur draagt.', requiresTooth: false, requiresSurface: false },
          { code: 'F124', description: 'Second opinion', points: null, tariff: 135.03, toelichting: 'Eenvoudig onderzoek bij de patient, niet leidend tot een behandelplan. Uitsluitend op verzoek van de patient. Exclusief rontgenonderzoek en gebitsmodellen.', requiresTooth: false, requiresSurface: false },
          { code: 'F125', description: 'Maken gebitsmodellen', points: null, tariff: 41.45, toelichting: 'Uitgebreid onderzoek aan de hand van de beoordeling van gebitsmodellen in gevallen waarin een eenvoudig diagnostisch onderzoek niet tot een verantwoorde diagnose leidt.', requiresTooth: false, requiresSurface: false },
          { code: 'F126', description: 'Beoordelen gebitsmodellen inclusief bespreken behandelplan', points: null, tariff: 120.53, toelichting: 'Het bestuderen van studiemodellen, inclusief beoordeling met vastlegging van de bevindingen en inclusief het opstellen van een behandelplan en bespreking met de patient.', requiresTooth: false, requiresSurface: false },
          { code: 'F127', description: 'Multidisciplinair consult, per 5 minuten', points: null, tariff: 15.15, toelichting: 'Gezamenlijk consult van meerdere behandelende tandheelkundige of medische disciplines. Per vijf minuten direct patientgebonden tijd.', requiresTooth: false, requiresSurface: false },
          { code: 'F128', description: 'Prenataal consult, per 5 minuten', points: null, tariff: 15.15, toelichting: 'Bespreking met de aankomende ouder(s) van de bevindingen van eerder uitgevoerd prenataal diagnostisch onderzoek. Alleen categorie C. Per vijf minuten.', requiresTooth: false, requiresSurface: false },
          { code: 'F129', description: 'Orthodontie in de eerste twee levensjaren', points: null, tariff: 1856.03, toelichting: 'Vroegtijdig orthodontisch behandelen bij een hazenlip of aangeboren spleet in bovenkaak en/of gehemelte, gedurende de eerste twee levensjaren. Alleen categorie C.', requiresTooth: false, requiresSurface: false },
          { code: 'F130', description: 'Uitgebreid onderzoek t.b.v. opstellen en vastleggen van complex behandelplan', points: null, tariff: 135.03, toelichting: 'Alleen te berekenen bij uitgebreide, altijd multidisciplinaire behandelingen. Eenmaal per behandeling te declareren.', requiresTooth: false, requiresSurface: false },
          { code: 'F131', description: 'Vervaardigen van een diagnostische set-up', points: null, tariff: 93.66, toelichting: 'Vervaardigen van een diagnostische set-up om te onderzoeken welke behandelresultaten mogelijk zijn. Inclusief bespreking van de set-up met patient.', requiresTooth: false, requiresSurface: false },
          { code: 'F132', description: 'Maken van extra gebitsmodellen t.b.v. behandelingsevaluatie', points: null, tariff: 41.45, toelichting: 'Gebitsmodellen die tijdens een complexe behandeling vervaardigd worden om de progressie te kunnen beoordelen. Inclusief bespreking met patient.', requiresTooth: false, requiresSurface: false },
          { code: 'F133', description: 'Beoordelen van extra gebitsmodellen t.b.v. behandelingsevaluatie', points: null, tariff: 120.53, toelichting: 'Het beoordelen van extra gebitsmodellen die tijdens een behandeling gemaakt worden. Inclusief vastlegging en bespreking van de bevindingen met de patient.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'II: Rontgenonderzoek',
        codes: [
          { code: 'F151', description: 'Intra-orale rontgenfoto (3x4 cm)', points: null, tariff: 21.00, toelichting: 'Maken en beoordelen. Per foto.', requiresTooth: true, requiresSurface: false },
          { code: 'F152', description: 'Occlusale opbeet rontgenfoto', points: null, tariff: 21.00, toelichting: 'Maken en beoordelen. Per foto.', requiresTooth: false, requiresSurface: false },
          { code: 'F153', description: 'Extra-orale rontgenfoto (13x18 cm)', points: null, tariff: 29.97, toelichting: 'Maken en beoordelen. Per foto. Alleen categorie B en C.', requiresTooth: false, requiresSurface: false },
          { code: 'F154', description: 'Rontgenonderzoek d.m.v. hand/polsfoto\'s', points: null, tariff: 36.73, toelichting: 'Alleen categorie B en C.', requiresTooth: false, requiresSurface: false },
          { code: 'F155', description: 'Vervaardiging orthopantomogram', points: null, tariff: 58.64, toelichting: 'Maken en beoordelen.', requiresTooth: false, requiresSurface: false },
          { code: 'F156', description: 'Beoordeling orthopantomogram', points: null, tariff: 34.37, toelichting: 'Beoordeling van een door een derde vervaardigde rontgenfoto, of bij het overnemen van een behandeling of op verzoek van een patient.', requiresTooth: false, requiresSurface: false },
          { code: 'F157', description: 'Vervaardiging laterale schedelrontgenfoto', points: null, tariff: 36.73, toelichting: 'Maken.', requiresTooth: false, requiresSurface: false },
          { code: 'F158', description: 'Beoordeling laterale schedelrontgenfoto', points: null, tariff: 102.53, toelichting: 'Beoordeling van een laterale schedelrontgenfoto, ook als deze door een derde is vervaardigd.', requiresTooth: false, requiresSurface: false },
          { code: 'F159', description: 'Vervaardiging voor-achterwaartse schedelrontgenfoto', points: null, tariff: 36.73, toelichting: 'Maken.', requiresTooth: false, requiresSurface: false },
          { code: 'F160', description: 'Beoordeling voor-achterwaartse schedelrontgenfoto', points: null, tariff: 102.53, toelichting: 'Beoordeling van een voor-achterwaartse schedelrontgenfoto, ook als deze door een derde is vervaardigd.', requiresTooth: false, requiresSurface: false },
          { code: 'F161', description: 'Meerdimensionale kaakfoto', points: null, tariff: 180.04, toelichting: 'Het maken van een meerdimensionale kaakfoto (bijvoorbeeld met een CT-scanner). Uitsluitend indien meerwaarde heeft ten opzichte van conventionele rontgendiagnostiek.', requiresTooth: false, requiresSurface: false },
          { code: 'F162', description: 'Beoordeling meerdimensionale kaakfoto', points: null, tariff: 75.02, toelichting: 'Het beoordelen van de meerdimensionale kaakfoto en het bespreken met de patient. Kan ook separaat in rekening worden gebracht.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'III: Behandeling - Plaatsen beugel',
        codes: [
          { code: 'F411', description: 'Plaatsen beugel categorie 1', points: null, tariff: 263.46, toelichting: 'Het plaatsen van een uitneembare beugel. Voorbeelden: expansieplaat, plaatje met protrusieveer, individueel gemaakte plaatapparatuur.', requiresTooth: false, requiresSurface: false },
          { code: 'F421', description: 'Plaatsen beugel categorie 2', points: null, tariff: 274.78, toelichting: 'Het plaatsen van een eenvoudige beugel ter beinvloeding van de kaakgroei met bijvoorbeeld een headgear, palatinale bar of linguale boog.', requiresTooth: false, requiresSurface: false },
          { code: 'F431', description: 'Plaatsen beugel categorie 3', points: null, tariff: 313.79, toelichting: 'Het plaatsen van een uitneembare beugel ter beinvloeding van de kaakgroei. Een voorbeeld hiervan is een blokbeugel (activator).', requiresTooth: false, requiresSurface: false },
          { code: 'F441', description: 'Plaatsen beugel categorie 4', points: null, tariff: 333.01, toelichting: 'Het plaatsen van met banden vastzittende kaakcorrectie-apparatuur zoals Herbst, MRA, RME. Bedoeld om de kaakgroei te beinvloeden.', requiresTooth: false, requiresSurface: false },
          { code: 'F451', description: 'Plaatsen beugel categorie 5', points: null, tariff: 750.15, toelichting: 'Het plaatsen van een vaste slotjesbeugel voor een tandboog. Materiaal- en techniekkosten afzonderlijk. Exclusief kosten brackets en bogen.', requiresTooth: false, requiresSurface: false },
          { code: 'F461', description: 'Plaatsen beugel categorie 6', points: null, tariff: 1222.26, toelichting: 'Het plaatsen van een vaste slotjesbeugel voor beide tandbogen. Materiaal- en techniekkosten afzonderlijk. Exclusief kosten brackets en bogen.', requiresTooth: false, requiresSurface: false },
          { code: 'F471', description: 'Plaatsen beugel categorie 7', points: null, tariff: 1133.00, toelichting: 'Het plaatsen van vacuumgevormde apparatuur verkregen door een digitale set-up. Minimaal 8 vacuumgevormde correctiehoesjes.', requiresTooth: false, requiresSurface: false },
          { code: 'F481', description: 'Plaatsen beugel categorie 8', points: null, tariff: 908.80, toelichting: 'Het plaatsen van brackets aan de linguale en/of palatinale zijde van gebitselementen voor een tandboog. Materiaal- en techniekkosten afzonderlijk.', requiresTooth: false, requiresSurface: false },
          { code: 'F491', description: 'Plaatsen beugel categorie 9', points: null, tariff: 1251.99, toelichting: 'Het plaatsen van brackets aan de linguale en/of palatinale zijde van gebitselementen in beide tandbogen. Materiaal- en techniekkosten afzonderlijk.', requiresTooth: false, requiresSurface: false },
          { code: 'F492', description: 'Verwijderen beugel categorie 5 t/m 9 per kaak', points: null, tariff: 157.67, toelichting: 'Het verwijderen van beugels bestaande uit vaste apparatuur (categorie 5 t/m 9) en het indien nodig plaatsen van retentie-apparatuur.', requiresTooth: false, requiresSurface: false },
          { code: 'F493', description: 'Verwijderen en opnieuw plaatsen van attachments gedurende de beugelbehandeling per kaak', points: null, tariff: 78.83, toelichting: 'Het verwijderen en opnieuw plaatsen van attachments gedurende de beugelbehandeling met beugel categorie 7 (refinements). Inclusief beugelconsult.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'III: Behandeling - Beugelconsult per kalendermaand',
        codes: [
          { code: 'F511', description: 'Beugelconsult per kalendermaand categorie 1', points: null, tariff: 81.44, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 1. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F512', description: 'Beugelconsult per kalendermaand categorie 2', points: null, tariff: 81.44, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 2. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F513', description: 'Beugelconsult per kalendermaand categorie 3', points: null, tariff: 81.44, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 3. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F514', description: 'Beugelconsult per kalendermaand categorie 4', points: null, tariff: 81.44, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 4. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F515', description: 'Beugelconsult per kalendermaand categorie 5', points: null, tariff: 89.58, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 5. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F516', description: 'Beugelconsult per kalendermaand categorie 6', points: null, tariff: 105.87, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 6. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F517', description: 'Beugelconsult per kalendermaand categorie 7', points: null, tariff: 81.44, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 7. Materiaal- en techniekkosten afzonderlijk (kosten vacuumgevormde correctiehoesjes).', requiresTooth: false, requiresSurface: false },
          { code: 'F518', description: 'Beugelconsult per kalendermaand categorie 8', points: null, tariff: 97.73, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 8. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F519', description: 'Beugelconsult per kalendermaand categorie 9', points: null, tariff: 122.16, toelichting: 'Het maandelijks behandelen van patienten met beugels uit categorie 9. Ongeacht het aantal bezoeken per kalendermaand.', requiresTooth: false, requiresSurface: false },
          { code: 'F520', description: 'Beugelconsult op afstand', points: null, tariff: 15.51, toelichting: 'Een beugelconsult op afstand om de voortgang van de behandeling te beoordelen. Alleen categorie A. Alleen bij direct zorggerelateerd contact.', requiresTooth: false, requiresSurface: false },
          { code: 'F521', description: 'Beugelconsult vanaf 25e behandelmaand (beugelcategorie 1 t/m 9)', points: null, tariff: 32.42, toelichting: 'Het maandelijks behandelen van patienten met beugels uit alle beugelcategorieen. Vanaf de 25e behandelmaand. Alleen categorie A.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'III: Behandeling - Nacontrole beugel',
        codes: [
          { code: 'F531', description: 'Nacontrole beugel categorie 1 t/m 4', points: null, tariff: 81.44, toelichting: 'Per consult. Uitvoeren van nacontroles en retentiecontroles na afloop van de actieve beugelbehandeling. Vanaf kalendermaand na beeindiging.', requiresTooth: false, requiresSurface: false },
          { code: 'F532', description: 'Nacontrole beugel categorie 5,7,8', points: null, tariff: 81.44, toelichting: 'Per consult. Uitvoeren van nacontroles en retentiecontroles na afloop van de actieve beugelbehandeling. Vanaf kalendermaand na verwijdering beugel en plaatsing retentie-apparatuur.', requiresTooth: false, requiresSurface: false },
          { code: 'F533', description: 'Nacontrole beugel categorie 6,9', points: null, tariff: 105.87, toelichting: 'Per consult. Uitvoeren van nacontroles en retentiecontroles na afloop van de actieve beugelbehandeling. Vanaf kalendermaand na verwijdering beugel en plaatsing retentie-apparatuur.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'IV: Diversen',
        codes: [
          { code: 'F611', description: 'Documenteren en bespreken gegevens elektronische chip in uitneembare apparatuur', points: null, tariff: 173.39, toelichting: 'Door middel van elektronische apparatuur meten en vastleggen van de therapietrouw bij het dragen van uitneembare apparatuur. Eenmalig gedurende gehele actieve behandelduur.', requiresTooth: false, requiresSurface: false },
          { code: 'F612', description: 'Plaatsen intermaxillaire correctieveren', points: null, tariff: 274.78, toelichting: 'Mag in rekening worden gebracht bij het plaatsen van intermaxillaire correctieveren. Niet bij reparatie of vervanging.', requiresTooth: false, requiresSurface: false },
          { code: 'F716', description: 'Mondbeschermer tijdens behandeling met apparatuur', points: null, tariff: 33.76, toelichting: 'Het vervaardigen en plaatsen van een mondbeschermer, alsmede het geven van instructie omtrent het gebruik, tijdens behandeling met orthodontische apparatuur.', requiresTooth: false, requiresSurface: false },
          { code: 'F721', description: 'Trekken tand of kies', points: null, tariff: 56.26, toelichting: 'Inclusief eventueel hechten, kosten hechtmateriaal en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'F722', description: 'Trekken volgende tand of kies, in dezelfde zitting en hetzelfde kwadrant', points: null, tariff: 42.01, toelichting: 'Inclusief eventueel hechten, kosten hechtmateriaal en wondtoilet.', requiresTooth: true, requiresSurface: false },
          { code: 'F723', description: 'Plaatsen micro-implantaat (voor beugel)', points: null, tariff: 135.60, toelichting: 'Het plaatsen van een micro-implantaat bedoeld als verankering bij een orthodontische behandeling en het weer verwijderen ervan. Per micro-implantaat.', requiresTooth: false, requiresSurface: false },
          { code: 'F724', description: 'Preventieve voorlichting en/of instructie', points: null, tariff: 16.82, toelichting: 'Het geven van voorlichting of instructie aan de patient. Per vijf minuten. Alleen in rekening te brengen indien consult langer dan tien minuten duurt.', requiresTooth: false, requiresSurface: false },
        ]
      },
      {
        name: 'IV: Diversen - Reparatie en retentie',
        codes: [
          { code: 'F810', description: 'Reparatie of vervanging beugel categorie 1 tot en met 4 vanwege slijtage', points: null, tariff: null, toelichting: 'Kostprijs. Het repareren of vervangen van orthodontische apparatuur die door gebruik zijn werkzaamheid heeft verloren. Alleen voor materiaal- en techniekkosten.', requiresTooth: false, requiresSurface: false },
          { code: 'F811', description: 'Reparatie of vervanging van beugel na verlies of onzorgvuldig gebruik', points: null, tariff: 56.60, toelichting: 'Het repareren of vervangen van (onderdelen van) een beugel na verlies of duidelijk onzorgvuldig gebruik door de patient. Niet voor reguliere reparaties.', requiresTooth: false, requiresSurface: false },
          { code: 'F812', description: 'Herstel en/of opnieuw plaatsen van retentie-apparatuur', points: null, tariff: 99.03, toelichting: 'Het repareren en/of opnieuw plaatsen van retentie-apparatuur. Per geplaatste retentiebeugel, ongeacht een of twee kaken. Uitsluitend een jaar na actieve behandeling.', requiresTooth: false, requiresSurface: false },
          { code: 'F813', description: 'Plaatsen (extra) retentie-apparatuur', points: null, tariff: 99.03, toelichting: 'Per geplaatste retentiebeugel. Het plaatsen van (extra) retentie-apparatuur voor extra houvast. Niet in combinatie met een beugelconsult.', requiresTooth: false, requiresSurface: false },
          { code: 'F814', description: 'Plaatsen retentie-apparatuur bij orthodontisch niet behandelde of door andere zorgaanbieder orthodontisch behandelde patient', points: null, tariff: 99.03, toelichting: 'Het plaatsen van een retentiebeugel bij patienten die door een andere orthodontische zorgaanbieder of in het geheel niet orthodontisch behandeld zijn.', requiresTooth: false, requiresSurface: false },
          { code: 'F815', description: 'Verwijderen spalk, per element', points: null, tariff: 7.50, toelichting: 'Hieronder wordt verstaan het verwijderen van de spalk, wegslijpen van composiet en het polijsten van de elementen.', requiresTooth: true, requiresSurface: false },
        ]
      },
      {
        name: 'IV: Diversen - Overig',
        codes: [
          { code: 'F900', description: 'Informatieverstrekking, per vijf minuten', points: null, tariff: 17.09, toelichting: 'Informatieverstrekking aan derden. Tarief per vijf minuten bestede tijd, inclusief bijbehorende rapportage. Afgerond naar dichtstbijzijnde veelvoud van vijf minuten.', requiresTooth: false, requiresSurface: false },
          { code: 'F901', description: 'Onderlinge dienstverlening', points: null, tariff: null, toelichting: 'De levering van (onderdelen van) prestaties orthodontische zorg door een zorgaanbieder in opdracht van een andere zorgaanbieder. Maximumtarief van toepassing.', requiresTooth: false, requiresSurface: false },
          { code: 'F911', description: 'Inkopen op uitkomst orthodontie', points: null, tariff: 2634.05, toelichting: 'Gehele orthodontische behandeling voor een patient tot 18 jaar met garantie op uitkomst voor 5 jaar. Alleen categorie A. Uitsluitend bij overeenkomst met zorgverzekeraar.', requiresTooth: false, requiresSurface: false },
        ]
      },
    ]
  },
];
