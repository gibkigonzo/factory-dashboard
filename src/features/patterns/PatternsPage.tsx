import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/** Przykład każdego wspólnego elementu z wariantami. Nowy element albo wariant dopisujesz tutaj. */
export function PatternsPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-4 lg:p-8">
      <h1 className="text-2xl font-semibold">Wzorce</h1>

      <section className="flex flex-col gap-3" data-pattern="button">
        <h2 className="text-lg font-medium">Button</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button">Domyślny</Button>
          <Button type="button" variant="secondary">
            Drugorzędny
          </Button>
          <Button type="button" variant="outline">
            Obrys
          </Button>
          <Button type="button" variant="ghost">
            Duch
          </Button>
          <Button type="button" variant="destructive">
            Usuń
          </Button>
          <Button type="button" variant="link">
            Link
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3" data-pattern="badge">
        <h2 className="text-lg font-medium">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Domyślna</Badge>
          <Badge variant="secondary">Drugorzędna</Badge>
          <Badge variant="outline">Obrys</Badge>
          <Badge variant="destructive">Błąd</Badge>
        </div>
      </section>
    </main>
  )
}
