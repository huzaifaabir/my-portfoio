
import { useState } from 'react';
import { useSite } from '../../context/SiteContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { staffApi } from '../../lib/services.js';
import { errorMessage } from '../../lib/format.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import ListEditor from '../../components/admin/ListEditor.jsx';
import { ErrorState, PageLoader } from '../../components/States.jsx';
import PageHeader from './PageHeader.jsx';

const SECTIONS = [
  {
    key: 'skills',
    title: 'Skills',
    text: 'Tools and abilities with a proficiency level. Group them with a category to organise the page.',
    empty: { name: '', category: '', level: 80 },
    fields: [
      { key: 'name', label: 'Skill', placeholder: 'e.g. Adobe Photoshop', max: 60 },
      { key: 'category', label: 'Category', placeholder: 'e.g. Software', max: 40 },
      { key: 'level', label: 'Level', type: 'range' },
    ],
    addLabel: 'Add skill',
    itemLabel: 'Skill',
  },
  {
    key: 'experience',
    title: 'Experience',
    text: 'Work history, newest first. Add an optional company website or social page link.',
    empty: {
      company: '',
      companyUrl: '',
      role: '',
      startYear: '',
      endYear: 'Present',
      description: '',
    },
    fields: [
      { key: 'role', label: 'Role / title', placeholder: 'Graphic Designer', max: 120 },
      { key: 'company', label: 'Company', placeholder: 'Organisation name', max: 120 },
      {
        key: 'companyUrl',
        label: 'Company website / Facebook / LinkedIn (optional)',
        placeholder: 'https://example.com',
        max: 600,
      },
      { key: 'startYear', label: 'Start year', placeholder: '2024', max: 10 },
      { key: 'endYear', label: 'End year', placeholder: 'Present', max: 20 },
      { key: 'description', label: 'Description (optional)', type: 'textarea', placeholder: 'What you did in this role', max: 600 },
    ],
    addLabel: 'Add experience',
    itemLabel: 'Position',
  },
  {
    key: 'services',
    title: 'Services',
    text: 'What you offer to clients. Use an emoji as the icon.',
    empty: { title: '', description: '', icon: '✦' },
    fields: [
      { key: 'icon', label: 'Icon (emoji)', placeholder: '🖼️', max: 20 },
      { key: 'title', label: 'Service title', placeholder: 'Poster Design', max: 80 },
      { key: 'description', label: 'Short description', type: 'textarea', placeholder: 'One or two sentences', max: 300 },
    ],
    addLabel: 'Add service',
    itemLabel: 'Service',
  },
];

export default function ResumeEditor() {
  const { profile, loading, error, refresh } = useSite();
  const toast = useToast();
  useDocumentTitle('Skills & Experience');
  const [drafts, setDrafts] = useState(null);
  const [saving, setSaving] = useState('');

  if (loading) return <PageLoader />;
  if (error || !profile) return <ErrorState message={error} onRetry={refresh} />;

  if (!drafts) {
    setDrafts({
      skills: profile.skills || [],
      experience: profile.experience || [],
      services: profile.services || [],
    });
    return null;
  }

  async function save(section) {
    setSaving(section);

    try {
      await staffApi.updateSection(section, drafts[section]);
      await refresh();
      toast.success(`${section[0].toUpperCase()}${section.slice(1)} saved.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving('');
    }
  }

  return (
    <div>
      <PageHeader
        title="Skills & experience"
        text="Keep your resume information current. Each section saves separately."
      />

      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.key} className="card space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </div>

            <ListEditor
              items={drafts[s.key]}
              onChange={(items) =>
                setDrafts((d) => ({ ...d, [s.key]: items }))
              }
              fields={s.fields}
              emptyItem={s.empty}
              addLabel={s.addLabel}
              itemLabel={s.itemLabel}
            />

            <div className="flex justify-end">
              <button
                className="btn-primary btn-sm"
                onClick={() => save(s.key)}
                disabled={saving === s.key}
              >
                {saving === s.key
                  ? 'Saving...'
                  : `Save ${s.title.toLowerCase()}`}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
