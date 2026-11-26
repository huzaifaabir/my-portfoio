import { useState } from 'react';
import { staffApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/ToastContext.jsx';
import { errorMessage } from '../../lib/format.js';
import { Field, Input, Textarea, Toggle } from '../../components/Form.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/States.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import PageHeader from './PageHeader.jsx';

const blank = { title: '', description: '', startingPrice: '', packages: [], deliveryTime: '', inclusions: '', isActive: true, featured: false, order: 0 };
const money = (value) => new Intl.NumberFormat('en-BD').format(value);

export default function ServicesManager() {
  const { data, loading, error, reload, setData } = useAsync(() => staffApi.manageServices(), []);
  const toast = useToast();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState('');
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useDocumentTitle('Services & Pricing');

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function edit(item) {
    setEditing(item.id);
    setForm({ ...item, startingPrice: item.startingPrice ?? '', inclusions: (item.inclusions || []).join('\n'), packages: item.packages || [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() { setEditing(''); setForm(blank); }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    const payload = { ...form, startingPrice: form.startingPrice === '' ? null : Number(form.startingPrice), inclusions: form.inclusions.split('\n').map((line) => line.trim()).filter(Boolean) };
    try {
      const saved = editing ? await staffApi.updateService(editing, payload) : await staffApi.createService(payload);
      setData((current) => {
        const items = current?.items || [];
        return { ...current, items: editing ? items.map((item) => item.id === editing ? saved : item) : [...items, saved] };
      });
      toast.success(editing ? 'Service updated.' : 'Service added.');
      reset();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  }

  async function remove() {
    setDeleting(true);
    try {
      await staffApi.deleteService(target.id);
      setData((current) => ({ ...current, items: current.items.filter((item) => item.id !== target.id) }));
      toast.success('Service deleted.');
      setTarget(null);
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setDeleting(false); }
  }

  function packageChange(index, key, value) {
    setForm((current) => ({ ...current, packages: current.packages.map((pack, i) => i === index ? { ...pack, [key]: value } : pack) }));
  }

  return (
    <div>
      <PageHeader title="Services & Pricing" text="Add services, set starting prices, create packages and control what appears on the website." />
      <form className="card mb-8 space-y-5" onSubmit={save}>
        <h2 className="text-lg font-semibold">{editing ? 'Edit service' : 'Add a service'}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Service title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={120} /></Field>
          <Field label="Starting price (BDT)" help="Leave blank if you want to discuss the price first."><Input type="number" min="0" value={form.startingPrice} onChange={(e) => set('startingPrice', e.target.value)} /></Field>
        </div>
        <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={1000} /></Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Delivery time"><Input value={form.deliveryTime} onChange={(e) => set('deliveryTime', e.target.value)} placeholder="e.g. 2–3 working days" /></Field>
          <Field label="Included features" help="One item per line."><Textarea rows={3} value={form.inclusions} onChange={(e) => set('inclusions', e.target.value)} /></Field>
        </div>
        <div className="space-y-3 rounded-xl border border-line p-4">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Packages</h3><button type="button" className="btn-ghost btn-sm" onClick={() => set('packages', [...form.packages, { name: '', price: '', description: '' }])}>+ Add package</button></div>
          {form.packages.map((pack, index) => <div key={index} className="grid gap-3 rounded-lg bg-surface-2 p-3 md:grid-cols-[1fr_140px_1fr_auto]">
            <Input placeholder="Package name" value={pack.name} onChange={(e) => packageChange(index, 'name', e.target.value)} />
            <Input type="number" min="0" placeholder="Price ৳" value={pack.price} onChange={(e) => packageChange(index, 'price', e.target.value)} />
            <Input placeholder="Short description (optional)" value={pack.description} onChange={(e) => packageChange(index, 'description', e.target.value)} />
            <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => set('packages', form.packages.filter((_, i) => i !== index))}>Remove</button>
          </div>)}
        </div>
        <div className="flex flex-wrap gap-6"><Toggle label="Visible on website" checked={form.isActive} onChange={(v) => set('isActive', v)} /><Toggle label="Featured" checked={form.featured} onChange={(v) => set('featured', v)} /></div>
        <div className="flex flex-wrap gap-2"><button className="btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update service' : 'Add service'}</button>{editing && <button type="button" className="btn-ghost btn-sm" onClick={reset}>Cancel edit</button>}</div>
      </form>
      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.items?.length === 0 && <EmptyState title="No services added" text="Use the form above to add your first service." />}
      {data?.items?.length > 0 && <div className="grid gap-4 md:grid-cols-2">{data.items.map((item) => <article key={item.id} className="card space-y-3"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-muted">{item.isActive ? 'Visible' : 'Hidden'}{item.featured ? ' · Featured' : ''}</p></div><p className="font-semibold">{item.startingPrice !== null ? `৳${money(item.startingPrice)}+` : item.packages?.length ? `${item.packages.length} package(s)` : 'Price not set'}</p></div><p className="text-sm text-muted">{item.description}</p><div className="flex gap-2 border-t border-line pt-3"><button className="btn-ghost btn-sm" onClick={() => edit(item)}>Edit</button><button className="btn-ghost btn-sm text-danger" onClick={() => setTarget(item)}>Delete</button></div></article>)}</div>}
      <ConfirmDialog open={!!target} danger busy={deleting} title="Delete this service?" message={target ? `"${target.title}" will be removed.` : ''} confirmLabel="Delete service" onConfirm={remove} onCancel={() => setTarget(null)} />
    </div>
  );
}
