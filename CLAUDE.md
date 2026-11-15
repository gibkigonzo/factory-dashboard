# factory-dashboard

Aplikacja do prowadzenia projektów fabryki oprogramowania: tablica zadań taśmy, decyzje właściciela, komendy, koszty i stan taśmy we wszystkich projektach. Tauri 2 na macOS i Androida, front w Reakcie 19 z Vite i TypeScriptem, bez serwera, ze stanem w GitHubie.

## Fabryka

Zmiany w tym repo robi taśma fabryki: issue z etykietą `ready` → plan → PR z gałęzi `factory/*` → recenzja → ocena ryzyka.

Gdy ktoś opisuje pomysł albo zmianę („mam pomysł”, „chcę, żeby…”, „dodaj…”), użyj skilla `spec-writer`: zapytaj, czy zapisać to jako notatkę (issue z etykietą `idea`), czy robicie spec. Issue zakładasz bez etykiety `ready`, bo ta uruchamia taśmę; dodajesz ją dopiero, gdy właściciel zgodzi się na start. Nie implementuj sam w tej sesji, chyba że właściciel wprost o to poprosi.

## Architektura

- **Rust (`src-tauri/`) robi tylko cztery rzeczy:**
  - logowanie do GitHuba kodem urządzenia;
  - token w systemowym pęku kluczy. Token nigdy nie trafia do JavaScriptu;
  - jedną komendę do API GitHuba z listą dozwolonych endpointów i metod;
  - cache ETag, bo odpowiedź 304 nie zużywa limitu zapytań.

  Wszystko inne jest w TypeScripcie. Nowy endpoint to zmiana listy dozwolonych, czyli strefa security.

- **Logika fabryki pochodzi z kodu fabryki,** przez zależność npm przypiętą do commita: statusy zadań, koszty i to, które komendy są dozwolone w danym stanie. Aplikacja nie liczy tego po swojemu. Adaptery są w `src/lib/factory/`.
- **Dane z GitHuba trzyma TanStack Query:** odpytywanie, cache i odświeżanie w tle, bez własnego mechanizmu odpytywania. Biblioteka stanu globalnego dopiero wtedy, gdy pojawi się stan, którego nie obsłużą Query ani stan komponentu. Taki przypadek planer opisuje w założeniach.
- **Ekrany obsługuje React Router** (`react-router`), jedna leniwie ładowana trasa na ekran.
- **Bez serwera i bez webhooków:** stan jest w GitHubie, a aplikacja go odpytuje.
- **Zależności:**
  - nowe pakiety npm i skrzynie Rusta wpisuje planer;
  - instaluje je workflow po `/approve` właściciela, w dokładnych wersjach;
  - `Cargo.lock` jest przypięty, a komendy Rusta działają z `--locked`, więc skrzynia dopisana ręcznie do `Cargo.toml` nie przejdzie CI.

## Struktura katalogów

```
src/features/<funkcja>/   ekrany i komponenty funkcji z testami: projects, board, task, new-task, costs, auth
src/components/ui/        komponenty shadcn/ui: wspólne elementy z biblioteki
src/components/           własne wspólne elementy aplikacji, np. RiskBadge, VerdictButtons
src/styles/theme.css      motyw z makiet: jedyne źródło tokenów wyglądu
src/lib/github/           klient GitHuba nad komendą Rusta
src/lib/factory/          adaptery kodu fabryki
src/mocks/ipc.ts          odpowiedzi komend Rusta dla e2e i zrzutów (VITE_MOCK_IPC)
src/features/patterns/    strona /patterns z przykładami wspólnych elementów, tylko w dev
src/router/               trasy ekranów
src-tauri/src/auth/       logowanie kodem urządzenia i pęk kluczy
src-tauri/src/github/     komenda zapytań: lista dozwolonych endpointów i metod, ETag
e2e/                      testy e2e ekranów (Playwright) i skrypt zrzutów
e2e/fixtures/             fikcyjne odpowiedzi API GitHuba dla testów i zrzutów
design/                   makiety: HTML ekranów i motyw
scripts/android.sh        build APK debug, pomijany bez zmian w Ruście i zależnościach
```

## Konwencje kodu

- **Nazwy w kodzie po angielsku:** pliki, komponenty, zmienne, funkcje, atrybuty `data-*`, nazwy testów i komentarze. Teksty widoczne w aplikacji są po polsku i stoją wprost w komponentach, bez biblioteki tłumaczeń.
- **React:** komponenty funkcyjne w plikach `.tsx` z nazwanym eksportem, jeden komponent ekranu albo elementu na plik. Nazwy komponentów w PascalCase, hooki jako `useX.ts`.
- **Rust:** nazewnictwo i formatowanie według `rustfmt`.
- **Testy TypeScriptu** leżą obok kodu jako `*.test.ts` albo `*.test.tsx`.
- **Testy Rusta** są w osobnym pliku `tests.rs`, dołączonym przez `#[cfg(test)] mod tests;`. Fabryka liczy test w pliku kodu jak kod.
- **Styl:**
  - TypeScript w trybie `strict`;
  - ESLint z regułami TypeScriptu i hooków Reacta oraz Prettier do formatowania;
  - typy sprawdza `tsc`;
  - w Ruście `rustfmt` z domyślnymi ustawieniami i `clippy`, w którym ostrzeżenie jest błędem.

## Wygląd

- **Wzorcem są makiety w `design/`:** HTML ekranów z Claude Design i motyw. Ekran ma wyglądać jak makieta przy 390 i 1280 px. W specu „Agent może zmienić” dotyczy tylko tego, czego makieta nie pokazuje.
- **Tokeny:**
  - motyw z makiet (zmienne CSS shadcn) leży w jednym pliku `src/styles/theme.css` i jest jedynym źródłem kolorów, promieni i czcionki;
  - komponenty używają tokenów przez klasy Tailwinda;
  - kolorów nie zapisują wprost (`#hex`, `rgb()`, `hsl()`).
- **Wspólne elementy mają dwie warstwy:**
  - `src/components/ui/`: komponenty shadcn/ui. Zmieniasz je tylko przez nowy wariant w samym komponencie (`cva`). Nie nadpisujesz ich wyglądu w miejscu użycia przez `!important`, skopiowane klasy ani własne wymiary obok klas komponentu.
  - `src/components/`: własne wspólne elementy aplikacji, np. `RiskBadge` i `VerdictButtons`, zbudowane z komponentów `ui`.
  - Każdy wspólny element ma przykład na trasie `/patterns`, dostępnej tylko w buildzie deweloperskim.
- **Ikony:** `lucide-react` (Lucide).
- **Tryby jasny i ciemny** działają według ustawień systemu i oba korzystają z tokenów. Wzorcem do porównań jest tryb jasny.
- **Układ jest mobile-first:**
  - telefon ma dolny pasek nawigacji;
  - od `lg` (1024 px) działa układ desktopowy z bocznym panelem;
  - sprawdzane szerokości to 390 i 1280 px.
- **Semantyka i dostępność:**
  - przycisk to `<button type="button">`;
  - przejście to `<a>` albo `Link` z React Routera, także gdy na razie nic nie robi;
  - `span` ani `div` nie udają przycisku ani linku;
  - cele dotyku mają co najmniej 44 px;
  - na desktopie wszystko działa z klawiatury, z widocznym fokusem.

## Testy i dowody

- **TypeScript:** Vitest i React Testing Library na happy-dom.
  - Logika w `src/lib/` i w adapterach fabryki zawsze ma testy jednostkowe.
  - Komponenty funkcji testujesz przez to, co widzi użytkownik: tekst i stan przycisków, a nie szczegóły implementacji.
- **E2E:** Playwright na froncie uruchomionym przez Vite.
  - Wywołania Rusta podmienia `mockIPC` z `@tauri-apps/api/mocks`.
  - Odpowiedzi GitHuba pochodzą z fikcyjnych plików w `e2e/fixtures/`.
  - Testy nie używają sieci ani prawdziwego tokenu.
  - Każdy ekran ma co najmniej jeden scenariusz z kryteriów specu.
- **Rust:**
  - Pęk kluczy jest za traitem, a w testach działa wersja w pamięci.
  - Zapytania idą do lokalnego serwera testowego, nie do GitHuba.
  - Listę dozwolonych endpointów sprawdza tabela przypadków: co przechodzi, a co jest odrzucane.
- **Zrzuty ekranu:** jedna komenda (`npm run screenshots`) renderuje w Playwright, przy 390 i 1280 px:
  - ekrany aplikacji z fikcyjnych danych jako `<ekran>@<szerokość>.png`;
  - makiety z `design/<ekran>.html` jako `<ekran>@<szerokość>.ref.png`;
  - stronę `/patterns` bez wzorca; taśma porównuje ją z gałęzią główną.

  Ekrany i makiety renderuje ta sama przeglądarka, więc różnica na zrzutach to różnica wyglądu, a nie renderowania.

- **Bez stałych testów pikselowych w repo.** Brak zmian wyglądu dowodzi porównanie zrzutów, które robi taśma.

## Wydania

- **Trunk-based:** `main` to jedyna stała gałąź, a gałęzie `factory/*` żyją do merge'u. Każdy PR zostawia działający `main`. Niegotowy ekran ukrywasz w nawigacji, zamiast trzymać go na długiej gałęzi.
- **Wersje:** numeracja 0.MINOR.PATCH, a wersja stoi tylko w `package.json`, skąd czyta ją `tauri.conf.json`. Zadania jej nie zmieniają; podbija ją workflow wydania.
- **Wydanie uruchamia właściciel komendą `/release`.** Fabryka sprawdza, kto pisze, i uruchamia `release.yml`, który:
  - podbija wersję i zakłada tag `vX.Y.Z`;
  - buduje `.dmg` na runnerze macOS i podpisany APK;
  - publikuje GitHub Release z listą scalonych PR.
- **Paczki powstają tylko przy wydaniu.** Po merge'u do `main` nic się nie buduje; PR sprawdza CI taśmy.
- **Pilna poprawka** to zwykły PR i nowe wydanie, bez gałęzi wydań.
