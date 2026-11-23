import Link from 'next/link';
import Image from 'next/image';
import { addProperty } from '@/actions/data';
import { currentUser } from '@/lib/auth';
import { Card, Alert, Field, Empty, Status } from '@/components/ui';
import { t } from '@/lib/i18n';
import { language } from '@/lib/i18n-server';
import { Plus, ShieldAlert } from 'lucide-react';

export default async function Properties({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const [{ db, profile }, lang] = await Promise.all([
    currentUser(),
    language(),
  ]);
  const { data } = await db
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  const properties = data || [];

  return (
    <>
      <div className="topbar" style={{ alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ color: '#0E6658' }}>
            PORTFOLIO
          </div>
          <h1 className="heading" style={{ margin: '4px 0 6px' }}>
            {t(lang, 'properties')}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Your houses, apartments, and villas in Tangier & across Morocco.
          </p>
        </div>

        {['owner', 'admin'].includes(profile.role) && (
          <a href="#new-property" className="btn">
            <Plus size={16} />
            <span>{t(lang, 'newProperty')}</span>
          </a>
        )}
      </div>

      <Alert searchParams={await searchParams} />

      <div className="two" style={{ alignItems: 'start' }}>
        {/* Left Column: Registered Properties */}
        <section>
          <div className="card-header-row" style={{ marginBottom: 16 }}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Registered properties
            </h2>
            <span className="card-count-badge">
              {properties.length} {properties.length === 1 ? 'home' : 'homes'}
            </span>
          </div>

          <div className="stack" style={{ gap: 12 }}>
            {properties.length ? (
              properties.map((p) => (
                <Link href={'/app/properties/' + p.id} key={p.id}>
                  <Card className="log-item" style={{ margin: 0, padding: 18 }}>
                    <div className="row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                          style={{
                            width: 84,
                            height: 68,
                            borderRadius: 10,
                            overflow: 'hidden',
                            background: '#E5EDE8',
                            flexShrink: 0,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Image
                            src="/house.svg"
                            alt="Illustrated property"
                            width={84}
                            height={68}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <strong style={{ fontSize: 15, color: 'var(--ink)' }}>{p.name}</strong>
                          <p className="muted small" style={{ margin: '4px 0 0', textTransform: 'capitalize' }}>
                            {p.city} · {p.property_type} {p.surface_m2 ? `· ${p.surface_m2} m²` : ''}
                          </p>
                        </div>
                      </div>
                      <Status value={p.status} />
                    </div>
                  </Card>
                </Link>
              ))
            ) : (
              <Empty message="No properties registered yet. Add your first Moroccan property to begin remote management." />
            )}
          </div>
        </section>

        {/* Right Column: New Property Form */}
        <section id="new-property">
          <Card>
            <div className="card-header-row">
              <h2 className="section-title" style={{ margin: 0 }}>
                {t(lang, 'newProperty')}
              </h2>
              <span className="eyebrow" style={{ color: '#0E6658' }}>
                REGISTRATION
              </span>
            </div>
            <p className="muted small" style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
              Submit a property you own or are legally authorized to manage. Title deed / ownership verification is conducted prior to on-site interventions.
            </p>

            {['owner', 'admin'].includes(profile.role) ? (
              <form action={addProperty} className="stack" style={{ gap: 14 }}>
                <Field
                  label="Property Name"
                  name="name"
                  required
                  placeholder="e.g. Tangier Marina Apartment"
                />

                <div className="fields">
                  <Field name="property_type" label="Type">
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </Field>
                  <Field label="City" name="city" value="Tangier" required />
                </div>

                <Field
                  label="Full Address (including building/door)"
                  name="address"
                  required
                  placeholder="e.g. Boulevard Mohammed VI, Résidence Al Manar, Porte 4"
                />

                <div className="fields">
                  <Field
                    name="bedrooms"
                    label="Bedrooms"
                    type="number"
                    min={0}
                    value={2}
                    required
                  />
                  <Field
                    name="surface_m2"
                    label="Area (m²)"
                    type="number"
                    min={0}
                    value={80}
                    step="0.01"
                    required
                  />
                </div>

                <div
                  style={{
                    background: '#FFF9F0',
                    border: '1px solid #FDE68A',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 11.5,
                    color: '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                  <span>
                    Properties enter a <b>pending verification</b> state until property ownership documentation is submitted.
                  </span>
                </div>

                <button className="btn" type="submit" style={{ alignSelf: 'flex-start' }}>
                  <Plus size={16} />
                  Submit for verification
                </button>
              </form>
            ) : (
              <p className="muted small">Property creation is restricted to registered owners and operations administrators.</p>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
