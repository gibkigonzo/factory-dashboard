**Bramka 1: jeszcze nie.** brakuje 20 ocenionych PR (0 z 20); trafne Low: 0, potrzeba co najmniej 8.

## Metryki

- PR z werdyktem fabryki: 2, z Twoją oceną: 0
- Zgodność: brak danych
- Fałszywe Low: 0
- Okno Bramki 1 (ostatnie 20 PR z oceną): 0 PR, zgodność brak danych, fałszywe Low: 0, trafne Low: 0
- Średnio rund poprawek: brak danych
- Mediana czasu od `ready` do merge'u: brak danych

**Próg pewności recenzentów (0,8)**, zakończone PR-y według najniższej pewności w panelu:
- pewność ≥ 0,8: 0 PR, przyjętych brak danych
- pewność < 0,8: 0 PR, przyjętych brak danych
- Za mało danych, żeby ocenić próg: potrzeba co najmniej 5 zakończonych PR w każdej grupie.

## Koszt

Równowartość cen API. Przy subskrypcji pokazuje, ile taśma waży w limitach.

- PR z pomiarem: 2, średnio 1,68 USD i 24 621 tokenów wyjścia na PR
- Etapy, średnio na PR: plan 0,40 USD · implementacja 0,42 USD · recenzja 0,75 USD · ocena ryzyka 0,11 USD
- Recenzenci, średnio na PR: security 0,27 USD · correctness 0,13 USD · spec 0,13 USD · tests 0,12 USD · maintainability 0,10 USD
- Wyjście (znaki): rozumowanie 1% · tekst 10% · narzędzia, w tym kod 90%
- Razem wszystkie zadania: 3,36 USD

## Problemy taśmy

Zgłoszenia agentów o kłopotach z narzędziami i komendami projektu, a nie z samym zadaniem: 1. Taśma się przez nie nie zatrzymuje; gdy problem wraca, zatrzymaj ją komendą `/stop <powód>` i zleć naprawę.

- 2026-11-17 · implementacja (#3, PR #4): `npm run lint` kończy się kodem 1: `prettier --check .` zgłasza pliki .factory/work/config.json, issue.md i prompt.md (poza zakresem zadania), więc kroki cargo fmt i clippy się nie wykonują.

## PR-y fabryki

- #14 Ścisłe CSP i uprawnienia aplikacji · High, do Ciebie · bez oceny · otwarty · 1,59 USD
- #4 Odczyt zadań, projektu fabryki i zatrzymania taśmy z danych GitHuba · High, do Ciebie · bez oceny · otwarty · 1,77 USD

Wszystkie zadania z kosztem na etap i recenzenta oraz Twoimi ocenami: [journal.csv](https://github.com/gibkigonzo/factory-dashboard/blob/factory-journal/journal.csv) (tabela) i [journal.json](https://github.com/gibkigonzo/factory-dashboard/blob/factory-journal/journal.json); problemy taśmy: [problemy.csv](https://github.com/gibkigonzo/factory-dashboard/blob/factory-journal/problemy.csv).

Progi Bramki 1: 20 ostatnich ocenionych PR (starsze wypadają z okna), w nich zgodność co najmniej 90%, fałszywych Low najwyżej 0 i trafnych Low co najmniej 8. Fałszywe Low to werdykt „scaliłaby”, który oceniłeś 👎, PR zamknięty bez merge'u albo merge cofnięty w ciągu 7 dni. Trafne Low to „scaliłaby” z Twoim 👍. Przyjęty PR to scalony i niecofnięty.

_Aktualizacja: 2026-11-21 05:28 UTC. Dziennik prowadzi workflow fabryki; nie edytuj go ręcznie._
