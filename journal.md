**Bramka 1: jeszcze nie.** brakuje 10 ocenionych PR (10 z 20); trafne Low: 0, potrzeba co najmniej 8.

## Metryki

- PR z werdyktem fabryki: 10, z Twoją oceną: 10
- Zgodność: 100% (10 z 10)
- Fałszywe Low: 0
- Okno Bramki 1 (ostatnie 20 PR z oceną): 10 PR, zgodność 100% (10 z 10), fałszywe Low: 0, trafne Low: 0, od #4
- Średnio rund poprawek: 1,2
- Mediana czasu od `ready` do merge'u: 45,8 h

**Próg pewności recenzentów (0,8)**, zakończone PR-y według najniższej pewności w panelu:
- pewność ≥ 0,8: 10 PR, przyjętych 100%
- pewność < 0,8: 0 PR, przyjętych brak danych
- Za mało danych, żeby ocenić próg: potrzeba co najmniej 5 zakończonych PR w każdej grupie.

## Koszt

Równowartość cen API. Przy subskrypcji pokazuje, ile taśma waży w limitach.

- PR z pomiarem: 10, średnio 2,58 USD i 40 017 tokenów wyjścia na PR
- Etapy, średnio na PR: plan 0,65 USD · implementacja 0,61 USD · recenzja 1,18 USD · ocena ryzyka 0,12 USD
- Recenzenci, średnio na PR: security 0,41 USD · spec 0,21 USD · tests 0,21 USD · correctness 0,21 USD · maintainability 0,16 USD
- Wyjście (znaki): rozumowanie 0% · tekst 7% · narzędzia, w tym kod 92%
- Razem wszystkie zadania: 25,76 USD

## Problemy taśmy

Zgłoszenia agentów o kłopotach z narzędziami i komendami projektu, a nie z samym zadaniem: 3. Taśma się przez nie nie zatrzymuje; gdy problem wraca, zatrzymaj ją komendą `/stop <powód>` i zleć naprawę.

- 2026-11-23 · plan (#11): W `commands` z `factory.yml` nie ma osobnej komendy testów Rusta (np. `cargo test --manifest-path src-tauri/Cargo.toml --locked`). Jeśli `npm test` jej nie wywołuje, implementer nie może sam uruchomić testów Rusta jako dowodu.
- 2026-11-22 · implementacja (#10): Nie dotyczy: `npm run lint` pada na formatowaniu moich plików, a nie na problemie taśmy.
- 2026-11-17 · implementacja (#3, PR #4): `npm run lint` kończy się kodem 1: `prettier --check .` zgłasza pliki .factory/work/config.json, issue.md i prompt.md (poza zakresem zadania), więc kroki cargo fmt i clippy się nie wykonują.

## PR-y fabryki

- #27 Cache ETag dla odczytów z GitHuba · High, do Ciebie · 👍 · scalony · 2,42 USD
- #26 Bloki fabryki tylko z komentarzy konta taśmy · High, do Ciebie · 👍 · scalony · 3,34 USD
- #24 Komenda zapytań do GitHuba z listą dozwolonych operacji · High, do Ciebie · 👍 · scalony · 3,07 USD
- #23 Kolumny tablicy zadań i dostępność komend · High, do Ciebie · 👍 · scalony · 5,38 USD
- #21 Uprawnienia Androida sprawdzane w zbudowanym APK · High, do Ciebie · 👍 · scalony · 1,88 USD
- #18 Odczyt dziennika taśmy z journal.json · High, do Ciebie · 👍 · scalony · 2,14 USD
- #17 Projekt Androida i APK debug w CI · High, do Ciebie · 👍 · scalony · 1,32 USD
- #15 Odczyt werdyktu trybu cienia, oceny i kosztów z komentarzy · High, do Ciebie · 👍 · scalony · 2,01 USD
- #14 Ścisłe CSP i uprawnienia aplikacji · High, do Ciebie · 👍 · scalony · 2,41 USD
- #4 Odczyt zadań, projektu fabryki i zatrzymania taśmy z danych GitHuba · High, do Ciebie · 👍 · scalony · 1,77 USD

Wszystkie zadania z kosztem na etap i recenzenta oraz Twoimi ocenami: [journal.csv](https://github.com/gibkigonzo/factory-dashboard/blob/factory-journal/journal.csv) (tabela) i [journal.json](https://github.com/gibkigonzo/factory-dashboard/blob/factory-journal/journal.json); problemy taśmy: [problemy.csv](https://github.com/gibkigonzo/factory-dashboard/blob/factory-journal/problemy.csv).

Progi Bramki 1: 20 ostatnich ocenionych PR (starsze wypadają z okna), w nich zgodność co najmniej 90%, fałszywych Low najwyżej 0 i trafnych Low co najmniej 8. Fałszywe Low to werdykt „scaliłaby”, który oceniłeś 👎, PR zamknięty bez merge'u albo merge cofnięty w ciągu 7 dni. Trafne Low to „scaliłaby” z Twoim 👍. Przyjęty PR to scalony i niecofnięty.

_Aktualizacja: 2026-11-28 13:01 UTC. Dziennik prowadzi workflow fabryki; nie edytuj go ręcznie._
