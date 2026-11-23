import { currentUser } from '@/lib/auth';
import { language } from '@/lib/i18n-server';
import { dateText } from '@/lib/i18n';
import { Card, Alert, Empty, Status } from '@/components/ui';
import { CheckSquare, Key, Clock, ShieldCheck, MapPin } from 'lucide-react';

export default async function AgentTasksPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { user, db } = await currentUser();
  const lang = await language();

  // Fetch inspections and properties assigned to agent
  const { data: assignments } = await db
    .from('inspections')
    .select('id, scheduled_for, status, property_id, properties(name, address, city)')
    .eq('agent_id', user.id)
    .order('scheduled_for', { ascending: true });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow" style={{ color: '#10B981' }}>OPÉRATIONS TERRAIN</div>
          <h1 className="heading" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckSquare size={22} style={{ color: '#10B981' }} /> Tâches & Interventions Opérationnelles
          </h1>
          <p className="muted">Suivi des remises de clés, accompagnement d&apos;artisans et vérifications d&apos;urgence à Tanger.</p>
        </div>
      </div>

      <Alert searchParams={await searchParams} />

      <div className="grid-2">
        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} color="#10B981" /> Procédures d&apos;Accueil & Clés
          </h2>
          <div className="stack small" style={{ gap: 12, lineHeight: 1.5 }}>
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
              <strong>1. Inventaire & Remise de clés</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Vérifier l&apos;identité du locataire ou du prestataire avant toute remise de trousseau. Chaque jeu doit être étiqueté avec le code propriété DARIYA.
              </p>
            </div>
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
              <strong>2. Relevé des compteurs</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Relever impérativement les index Amendis (eau et électricité) lors de chaque entrée/sortie et consigner les photos dans la fiche d&apos;inspection.
              </p>
            </div>
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
              <strong>3. Sécurisation des accès</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                Vérification de la fermeture de tous les volets, robinets d&apos;arrêt d&apos;eau généraux et du disjoncteur différentiel en cas de vacance.
              </p>
            </div>
          </div>
        </Card>

        <Card className="panel">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#10B981" /> Planning Opérationnel
          </h2>
          {assignments && assignments.length > 0 ? (
            <div className="stack" style={{ gap: 10 }}>
              {assignments.map(a => {
                const prop = Array.isArray(a.properties) ? a.properties[0] : a.properties;
                return (
                  <div key={a.id} className="list-item" style={{ padding: '12px 14px' }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{prop?.name}</strong>
                        <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <MapPin size={12} /> {prop?.address}, {prop?.city}
                        </div>
                      </div>
                      <Status value={a.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty message="Aucune tâche opérationnelle assignée." />
          )}
        </Card>
      </div>
    </>
  );
}
