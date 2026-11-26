
import { useRef, useState } from 'react';
import { staffApi } from '../../lib/services.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/ToastContext.jsx';
import { errorMessage } from '../../lib/format.js';
import { imageSrc } from '../../lib/api.js';
import { Field, Input, Toggle } from '../../components/Form.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/States.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import PageHeader from './PageHeader.jsx';

function PartnerCard({ partner, onSave, onDelete, onMove, saving }) {
  const [name, setName] = useState(partner.name || '');
  const [website, setWebsite] = useState(partner.website || '');
  const [isActive, setIsActive] = useState(partner.isActive);
  const toast = useToast();
  const [replacing, setReplacing] = useState(false);

  async function save() {
    await onSave(partner.id, {
      name: name.trim(),
      website: website.trim(),
      logo: partner.logo,
      isActive,
      order: partner.order || 0,
    });
  }

  async function replaceLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      throw new Error('Choose a JPG, PNG, WEBP or GIF image up to 5 MB.');
    }
    setReplacing(true);
    try {
      const uploaded = await staffApi.uploadImage(file, 'brands');
      try {
        await onSave(partner.id, {
          name: name.trim(),
          website: website.trim(),
          logo: uploaded,
          isActive,
          order: partner.order || 0,
        });
      } catch {
        await staffApi.deleteUpload(uploaded.path).catch(() => {});
        return;
      }
      if (partner.logo?.path && partner.logo.path !== uploaded.path) {
        await staffApi.deleteUpload(partner.logo.path).catch(() => {});
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setReplacing(false);
    }
  }

  async function toggleActive(checked) {
    setIsActive(checked);

    try {
      await onSave(partner.id, {
        name: name.trim(),
        website: website.trim(),
        logo: partner.logo,
        isActive: checked,
        order: partner.order || 0,
      });
    } catch {
      setIsActive(!checked);
    }
  }

  return (
    <article className="card space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-white p-3">
          {imageSrc(partner.logo) ? (
            <img
              src={imageSrc(partner.logo)}
              alt={partner.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-500">No logo</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold">{partner.name}</p>
          <p className="mt-1 truncate text-xs text-muted">
            {partner.website || 'No website added'}
          </p>
          <span className={`badge mt-2 ${partner.isActive ? 'text-success' : 'text-muted'}`}>
            {partner.isActive ? 'Visible on website' : 'Hidden'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Field label="Replace logo" help="JPG, PNG, WEBP or GIF, maximum 5 MB.">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={replaceLogo} disabled={replacing || saving} className="input text-sm" />
        </Field>
        <Field label="Brand name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </Field>

        <Field label="Website URL" help="Optional. Example: https://example.com">
          <Input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            maxLength={600}
          />
        </Field>

        <Toggle
          label="Show on homepage"
          checked={isActive}
          onChange={toggleActive}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={save}
          disabled={saving || replacing || !name.trim()}
        >
          Save changes
        </button>
        {replacing && <span className="self-center text-xs text-muted">Uploading replacement...</span>}

        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => onMove(partner.id, -1)}
          title="Move up"
        >
          ↑
        </button>

        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => onMove(partner.id, 1)}
          title="Move down"
        >
          ↓
        </button>

        <button
          type="button"
          className="btn-ghost btn-sm text-danger"
          onClick={() => onDelete(partner)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default function BrandPartners() {
  const fileInput = useRef(null);
  const toast = useToast();

  const { data, loading, error, reload, setData } = useAsync(
    () => staffApi.manageBrandPartners(),
    []
  );

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useDocumentTitle('Brand Partners');

  function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const valid = files.filter((file) => (
      allowed.includes(file.type) &&
      file.size <= 5 * 1024 * 1024
    ));

    if (valid.length !== files.length) {
      toast.error('Some files were skipped. Use JPG, PNG, WEBP or GIF up to 5 MB each.');
    }

    setSelectedFiles((current) => [...current, ...valid].slice(0, 10));
  }

  async function uploadSelected() {
    if (!selectedFiles.length || uploading) return;

    setUploading(true);
    const files = [...selectedFiles];
    let createdCount = 0;
    let uploadedItems = [];

    try {
      const result = await staffApi.uploadBrandImages(files);
      uploadedItems = result.items || [];

      if (uploadedItems.length !== files.length) {
        throw new Error('The server returned an unexpected number of uploaded images.');
      }

      const created = [];

      for (let index = 0; index < uploadedItems.length; index += 1) {
        const file = files[index];
        const uploaded = uploadedItems[index];

        const defaultName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim();

        const partner = await staffApi.createBrandPartner({
          name: defaultName || `Brand ${index + 1}`,
          logo: uploaded,
          website: '',
          isActive: true,
          order: (data?.items?.length || 0) + index,
        });

        created.push(partner);
        createdCount += 1;
      }

      setData((current) => ({
        ...current,
        items: [...(current?.items || []), ...created],
      }));

      setSelectedFiles([]);
      toast.success(`${created.length} brand logo(s) added successfully.`);
    } catch (err) {
      // Clean up uploads that were not saved as brand records.
      const unusedUploads = uploadedItems.slice(createdCount);

      await Promise.allSettled(
        unusedUploads.map((item) => staffApi.deleteUpload(item.path))
      );

      toast.error(errorMessage(err));
      reload();
    } finally {
      setUploading(false);
    }
  }

  async function savePartner(id, payload) {
    setSavingId(id);

    try {
      const updated = await staffApi.updateBrandPartner(id, payload);

      setData((current) => ({
        ...current,
        items: current.items.map((item) => (
          item.id === id ? updated : item
        )),
      }));

      toast.success('Brand partner updated.');
    } catch (err) {
      toast.error(errorMessage(err));
      throw err;
    } finally {
      setSavingId('');
    }
  }

  async function movePartner(id, direction) {
    const items = [...(data?.items || [])];
    const index = items.findIndex((item) => item.id === id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return;

    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];

    const reordered = items.map((item, position) => ({
      ...item,
      order: position,
    }));

    setData((current) => ({ ...current, items: reordered }));

    try {
      await staffApi.reorderBrandPartners(
        reordered.map((item) => ({ id: item.id }))
      );
    } catch (err) {
      toast.error(errorMessage(err));
      reload();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await staffApi.deleteBrandPartner(deleteTarget.id);

      setData((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== deleteTarget.id),
      }));

      toast.success('Brand partner deleted.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Brand Partners"
        text="Manage the logos displayed in the homepage brand partners section."
      />

      <section className="card mb-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Add brand logos</h2>
          <p className="mt-1 text-sm text-muted">
            Select up to 10 images at once. Each image can be up to 5 MB.
          </p>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          onChange={handleFileSelection}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            Choose multiple images
          </button>

          {selectedFiles.length > 0 && (
            <button
              type="button"
              className="btn-ghost btn-sm text-danger"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
            >
              Clear selection
            </button>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {selectedFiles.length} image(s) selected
            </p>

            <ul className="space-y-1 text-sm text-muted">
              {selectedFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex justify-between gap-3">
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={uploadSelected}
              disabled={uploading}
            >
              {uploading ? 'Uploading and saving...' : `Upload ${selectedFiles.length} logo(s)`}
            </button>
          </div>
        )}
      </section>

      {loading && <PageLoader />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && data.items.length === 0 && (
        <EmptyState
          title="No brand partners yet"
          text="Choose multiple logo images above to add your first brand partners."
        />
      )}

      {data?.items?.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              Your brand partners ({data.items.length})
            </h2>
            <p className="text-xs text-muted">
              Use the arrows to change display order.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {data.items.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onSave={savePartner}
                onDelete={setDeleteTarget}
                onMove={movePartner}
                saving={savingId === partner.id}
              />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        danger
        busy={deleting}
        title="Delete this brand partner?"
        message={deleteTarget ? `"${deleteTarget.name}" will be removed from your brand partners list.` : ''}
        confirmLabel="Delete partner"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
