import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { ROUTES } from "@/lib/routes.config"

export default function CuentaCorrientePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader />
        
        <Link
          href={ROUTES.HOME}
          className="mb-4 inline-flex items-center gap-2 h-9 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Volver al menu
        </Link>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Cuenta Corriente
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gestion de cuenta corriente de clientes
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent mb-4">
            <CreditCard className="h-6 w-6 text-primary" strokeWidth={2} />
          </div>
          <p className="text-sm text-muted-foreground">
            Seccion integrada con GeneXus
          </p>
        </div>

        <div className="mt-4">
          <Link
            href={ROUTES.HOME}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Cerrar
          </Link>
        </div>
      </div>
    </main>
  )
}
